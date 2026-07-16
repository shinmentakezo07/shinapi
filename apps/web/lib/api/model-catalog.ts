import type { ModelInfo } from "./sdk";
import type { OpenRouterModelData } from "@/types/model";
import type { EnrichedModel } from "@/components/playground/types";
import { getProviderLogo } from "@/lib/provider-logos";

/** Raw catalog row may arrive as camelCase or snake_case from the Go runtime. */
export type CatalogModelRaw = Partial<ModelInfo> & {
  id?: string;
  name?: string;
  provider?: string;
  description?: string;
  capabilities?: string[];
  inputPricePer1k?: number;
  outputPricePer1k?: number;
  contextWindow?: number;
  input_price_per_1k?: number;
  output_price_per_1k?: number;
  context_window?: number;
  supports_thinking?: boolean;
  supports_vision?: boolean;
  supports_tools?: boolean;
  status?: string;
};

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

/** Normalize API payload into the TS ModelInfo shape. */
export function normalizeModelInfo(raw: CatalogModelRaw): ModelInfo {
  const id = raw.id ?? "";
  const provider =
    raw.provider ||
    (id.includes("/") ? id.slice(0, id.indexOf("/")) : id) ||
    "unknown";
  return {
    id,
    name: raw.name || id,
    provider,
    inputPricePer1k: num(
      raw.inputPricePer1k ?? raw.input_price_per_1k,
      0,
    ),
    outputPricePer1k: num(
      raw.outputPricePer1k ?? raw.output_price_per_1k,
      0,
    ),
    contextWindow: num(raw.contextWindow ?? raw.context_window, 0),
    description: raw.description || "",
    capabilities: Array.isArray(raw.capabilities) ? raw.capabilities : [],
  };
}

/** Convert dollars-per-1k-tokens to OpenRouter-style per-token string. */
function perTokenPrice(pricePer1k: number | undefined | null): string | null {
  if (pricePer1k == null || Number.isNaN(pricePer1k)) return null;
  if (pricePer1k === 0) return "0";
  return String(pricePer1k / 1000);
}

function providerFromId(id: string, fallback?: string): string {
  if (fallback) return fallback;
  const slash = id.indexOf("/");
  return slash > 0 ? id.slice(0, slash) : id;
}

/**
 * Map backend runtime ModelInfo → marketing/models page shape.
 * Keeps fully-qualified `provider/modelId` ids for gateway routing.
 */
export function modelInfoToOpenRouterShape(m: ModelInfo): OpenRouterModelData {
  const context = m.contextWindow || null;
  return {
    id: m.id,
    name: m.name || m.id,
    created: 0,
    created_date: null,
    description: m.description || null,
    context_length: context,
    pricing: {
      prompt: perTokenPrice(m.inputPricePer1k),
      completion: perTokenPrice(m.outputPricePer1k),
      input_cache_read: null,
      input_cache_write: null,
      web_search: null,
    },
    architecture: {
      modality: "text->text",
      input_modalities: m.capabilities?.includes("vision")
        ? ["text", "image"]
        : ["text"],
      output_modalities: ["text"],
      tokenizer: "Unknown",
      instruct_type: null,
    },
    top_provider: context
      ? {
          context_length: context,
          max_completion_tokens: Math.min(context, 16384),
          is_moderated: false,
        }
      : null,
    supported_parameters: m.capabilities ?? [],
    knowledge_cutoff: null,
  };
}

/**
 * Map backend ModelInfo → playground EnrichedModel.
 */
export function modelInfoToEnriched(m: ModelInfo): EnrichedModel {
  return {
    id: m.id,
    name: m.name || m.id,
    logo: getProviderLogo(m.id),
    provider: providerFromId(m.id, m.provider),
    context_length: m.contextWindow || undefined,
    pricing: {
      prompt: perTokenPrice(m.inputPricePer1k) ?? undefined,
      completion: perTokenPrice(m.outputPricePer1k) ?? undefined,
    },
    description: m.description || undefined,
  };
}

export function mapCatalogToOpenRouter(
  models: CatalogModelRaw[] | ModelInfo[],
): OpenRouterModelData[] {
  return models
    .map((m) => normalizeModelInfo(m as CatalogModelRaw))
    .filter((m) => m.id)
    .map(modelInfoToOpenRouterShape);
}

export function mapCatalogToEnriched(
  models: CatalogModelRaw[] | ModelInfo[],
): EnrichedModel[] {
  return models
    .map((m) => normalizeModelInfo(m as CatalogModelRaw))
    .filter((m) => m.id)
    .map(modelInfoToEnriched);
}
