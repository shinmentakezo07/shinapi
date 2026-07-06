package router

import (
	"context"
	"sort"
	"strings"

	"dra-platform/backend/pkg/llm"
	llmprovider "dra-platform/backend/pkg/llm/provider"
)

// BudgetRouter finds cheaper models when the requested model exceeds budget.
type BudgetRouter struct {
	registry *llmprovider.Registry
}

// NewBudgetRouter creates a budget-aware router.
func NewBudgetRouter(registry *llmprovider.Registry) *BudgetRouter {
	return &BudgetRouter{registry: registry}
}

// ModelOption represents a candidate model with estimated cost.
type ModelOption struct {
	ModelID       string
	Provider      string
	InputPrice    float64
	OutputPrice   float64
	EstimatedCost int
}

// FindAffordableModel searches for a cheaper model the user can afford.
// It returns the model ID to use and true if a downgrade was performed.
// req may be nil; when provided, actual request needs (tools, vision, thinking)
// are extracted from the request rather than from the model's capabilities.
func (br *BudgetRouter) FindAffordableModel(ctx context.Context, requestedModel string, budget int, estimatedInputTokens, estimatedOutputTokens int, req *llm.ChatRequest) (string, bool) {
	models, err := br.registry.AllModels(ctx)
	if err != nil {
		return requestedModel, false
	}

	// Find requested model info to get actual capabilities and price
	var requestedInfo *llm.ModelInfo
	for i := range models {
		if matchModel(models[i].ID, requestedModel) || matchModel(models[i].Provider+"/"+models[i].ID, requestedModel) {
			requestedInfo = &models[i]
			break
		}
	}

	// Compute estimated cost for the requested model using model-specific pricing
	currentCost := CostEstimate(estimatedInputTokens, estimatedOutputTokens, requestedInfo)

	// If the requested model is already affordable, no routing needed
	if budget >= currentCost {
		return requestedModel, false
	}

	// Determine actual needs from the request when available, falling back to
	// the requested model's capabilities. This avoids requiring fallback models
	// to match ALL capabilities of the original model — only the ones the
	// request actually uses.
	needsTools := false
	needsVision := false
	needsThinking := false

	if req != nil {
		needsTools = len(req.Tools) > 0
		needsVision = hasVisionContent(req)
		needsThinking = req.Thinking != nil && req.Thinking.Enabled
	} else if requestedInfo != nil {
		needsTools = requestedInfo.SupportsTools
		needsVision = requestedInfo.SupportsVision
		needsThinking = requestedInfo.SupportsThinking
	}

	var currentPrice float64
	if requestedInfo != nil {
		currentPrice = requestedInfo.InputPricePer1k + requestedInfo.OutputPricePer1k
	}

	var candidates []ModelOption
	for _, m := range models {
		modelID := m.ID
		if m.Provider != "" && !strings.Contains(m.ID, "/") {
			modelID = m.Provider + "/" + m.ID
		}

		if matchModel(modelID, requestedModel) {
			continue
		}

		if needsTools && !m.SupportsTools {
			continue
		}
		if needsVision && !m.SupportsVision {
			continue
		}
		if needsThinking && !m.SupportsThinking {
			continue
		}

		price := m.InputPricePer1k + m.OutputPricePer1k
		if currentPrice > 0 && price >= currentPrice {
			continue
		}

		estCost := int((float64(estimatedInputTokens)/1000.0*m.InputPricePer1k + float64(estimatedOutputTokens)/1000.0*m.OutputPricePer1k) * 100)
		if estCost < 100 {
			estCost = 100
		}

		candidates = append(candidates, ModelOption{
			ModelID:       modelID,
			Provider:      m.Provider,
			InputPrice:    m.InputPricePer1k,
			OutputPrice:   m.OutputPricePer1k,
			EstimatedCost: estCost,
		})
	}

	if len(candidates) == 0 {
		return requestedModel, false
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].InputPrice+candidates[i].OutputPrice < candidates[j].InputPrice+candidates[j].OutputPrice
	})

	for _, c := range candidates {
		if c.EstimatedCost <= budget {
			return c.ModelID, true
		}
	}

	// If none fit the budget, return the absolute cheapest as a fallback
	return candidates[0].ModelID, true
}

// hasVisionContent checks whether the request contains image content that
// requires a vision-capable model.
func hasVisionContent(req *llm.ChatRequest) bool {
	if req == nil {
		return false
	}
	for _, m := range req.Messages {
		for _, cb := range m.ContentBlocks {
			if cb.Type == llm.ContentTypeImage {
				return true
			}
		}
	}
	return false
}

func matchModel(modelID, pattern string) bool {
	if modelID == pattern {
		return true
	}
	parts := strings.Split(modelID, "/")
	if len(parts) == 2 && parts[1] == pattern {
		return true
	}
	return strings.Contains(strings.ToLower(modelID), strings.ToLower(pattern))
}

// modelPriceMultiplier returns a credits-per-token multiplier based on the
// model tier. Premium models (opus, o1, o3) cost more; mini/small models cost
// less; standard models use the baseline of 2.
func modelPriceMultiplier(modelID string) int {
	if modelID == "" {
		return 2
	}
	lower := strings.ToLower(modelID)
	switch {
	// Premium / reasoning models
	case strings.Contains(lower, "opus"),
		strings.Contains(lower, "o1-"),
		strings.Contains(lower, "o3-"),
		strings.Contains(lower, "gpt-4-turbo"),
		strings.Contains(lower, "gpt-4o"),
		strings.Contains(lower, "deepseek-r1"):
		return 10
	// Standard / mid-tier models
	case strings.Contains(lower, "sonnet"),
		strings.Contains(lower, "gpt-4"),
		strings.Contains(lower, "claude-3.5"),
		strings.Contains(lower, "gemini-2.5-pro"),
		strings.Contains(lower, "gemini-1.5-pro"):
		return 2
	// Mini / small / flash models
	case strings.Contains(lower, "mini"),
		strings.Contains(lower, "haiku"),
		strings.Contains(lower, "small"),
		strings.Contains(lower, "flash"),
		strings.Contains(lower, "gpt-3.5"),
		strings.Contains(lower, "llama-3"),
		strings.Contains(lower, "gemma"):
		return 1
	default:
		return 2
	}
}

// CostEstimate calculates estimated credits for given tokens using
// model-specific pricing when available. If modelInfo is provided, it uses
// actual per-1k-token pricing. Otherwise, it falls back to a tiered
// multiplier based on the model name.
func CostEstimate(inputTokens, outputTokens int, modelInfo *llm.ModelInfo) int {
	if modelInfo != nil && (modelInfo.InputPricePer1k > 0 || modelInfo.OutputPricePer1k > 0) {
		inputCost := float64(inputTokens) / 1000.0 * modelInfo.InputPricePer1k * 100
		outputCost := float64(outputTokens) / 1000.0 * modelInfo.OutputPricePer1k * 100
		total := int(inputCost + outputCost)
		if total < 100 {
			return 100
		}
		return total
	}

	// Fallback: tiered multiplier based on model name
	mult := modelPriceMultiplier(modelInfo.ID)
	total := (inputTokens + outputTokens) * mult
	if total < 100 {
		return 100
	}
	return total
}
