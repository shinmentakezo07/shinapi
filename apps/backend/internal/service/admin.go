package service

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"dra-platform/backend/internal/domain"
	"dra-platform/backend/internal/pkg/logger"
	"dra-platform/backend/internal/repository"
	"dra-platform/backend/pkg/llm"
	"dra-platform/backend/pkg/llm/cache"
	"dra-platform/backend/pkg/llm/loadbalancer"
	llmprovider "dra-platform/backend/pkg/llm/provider"
	llmrouter "dra-platform/backend/pkg/llm/router"
	"dra-platform/backend/pkg/llm/watcher"
)

type AdminService struct {
	userRepo     *repository.AdminUserRepo
	providerRepo *repository.AdminProviderRepo
	modelRepo    *repository.AdminModelRepo
	billingRepo  *repository.AdminBillingRepo
	settingsRepo *repository.AdminSettingsRepo
	auditRepo    *repository.AdminAuditRepo
	securityRepo *repository.AdminSecurityRepo
	featuresRepo *repository.AdminFeaturesRepo
	auditSvc     *AuditService
	llmRegistry  *llmprovider.Registry
	llmCache     cache.Cache
	llmWatcher   *watcher.Watcher

	// keyCipher encrypts provider API keys for durable DB storage (AES-GCM).
	// Derived from AUTH_SECRET via SetKeyEncryptionSecret.
	keyCipher cipher.AEAD

	// rawKeyStore holds decrypted API keys in memory so providers can be
	// hot-registered without re-decrypting every request.
	// Keyed by provider-key ID. Seeded from encrypted_key on startup.
	rawKeyStore sync.Map

	// runtimeSync fans provider hot-register/unregister events out to the
	// subsystems that snapshot providers at startup: the model router, the
	// load balancer, and the health checker. Without this, a provider added
	// at runtime is registered in the LLM Registry (so direct model-scoped
	// routing sees it) but invisible to router/balancer/health routes until a
	// restart. Set via SetRuntimeSync (wired in cmd/api/services.go after
	// those components exist). May be nil in tests/standalone use.
	runtimeSync *runtimeSync
}

// runtimeSync holds the LLM subsystems that snapshot providers at startup.
// The admin service pushes add/remove events into them so newly-added
// providers become live without a server restart.
type runtimeSync struct {
	modelRouter   *llmrouter.Router
	loadBalancer  *loadbalancer.Balancer
	healthChecker *llmprovider.HealthChecker
}

// SetRuntimeSync wires the router/balancer/health-checker that should be
// notified when providers are hot-registered or unregistered at runtime.
func (s *AdminService) SetRuntimeSync(mr *llmrouter.Router, lb *loadbalancer.Balancer, hc *llmprovider.HealthChecker) {
	s.runtimeSync = &runtimeSync{
		modelRouter:   mr,
		loadBalancer:  lb,
		healthChecker: hc,
	}
}

// syncRuntimeAdd mirrors a freshly-registered provider into the router,
// load balancer, and health checker. Idempotent: re-registering an existing
// provider name replaces (router) / upserts (balancer) / re-registers (hc)
// rather than duplicating. Safe to call when runtimeSync is nil (no-op).
func (s *AdminService) syncRuntimeAdd(p llm.Provider) {
	if s.runtimeSync == nil || p == nil {
		return
	}
	rs := s.runtimeSync
	if rs.modelRouter != nil {
		rs.modelRouter.Register(p)
		rs.modelRouter.InvalidateProvider(p.Name())
	}
	if rs.loadBalancer != nil {
		var baseURL string
		if bu, ok := p.(interface{ BaseURL() string }); ok {
			baseURL = bu.BaseURL()
		}
		rs.loadBalancer.AddEndpoint(&loadbalancer.Endpoint{
			ID:        p.Name(),
			Provider:  p.Name(),
			Model:     "*",
			BaseURL:   baseURL,
			IsActive:  true,
			IsHealthy: true,
			Priority:  1,
		})
	}
	if rs.healthChecker != nil {
		var url string
		if bu, ok := p.(interface{ BaseURL() string }); ok {
			url = bu.BaseURL()
		}
		if url != "" {
			rs.healthChecker.Register(p.Name(), llmprovider.HTTPHealthCheck(&http.Client{Timeout: 10 * time.Second}, url))
		}
	}
}

// unregisterProviderRuntime drops a provider from the LLM Registry and every
// runtime subsystem (router, balancer, health checker) so deleted/deactivated
// providers stop receiving traffic immediately.
func (s *AdminService) unregisterProviderRuntime(name string) {
	if s.llmRegistry != nil {
		s.llmRegistry.Unregister(name)
	}
	if s.runtimeSync == nil {
		return
	}
	rs := s.runtimeSync
	if rs.modelRouter != nil {
		rs.modelRouter.Unregister(name)
	}
	if rs.loadBalancer != nil {
		rs.loadBalancer.RemoveEndpoint(name)
	}
	if rs.healthChecker != nil {
		rs.healthChecker.Unregister(name)
	}
}

// SyncRuntimeFromRegistry reconciles the router/balancer/health-checker with
// the current contents of the LLM Registry. Called once at startup after
// SetRuntimeSync (and after LoadProvidersFromDB) so DB-loaded providers —
// which register before the sync targets are wired — still enter the runtime
// subsystems without needing a restart.
func (s *AdminService) SyncRuntimeFromRegistry() {
	if s.llmRegistry == nil || s.runtimeSync == nil {
		return
	}
	for _, name := range s.llmRegistry.Providers() {
		if p, ok := s.llmRegistry.Get(name); ok {
			s.syncRuntimeAdd(p)
		}
	}
}

func NewAdminService(
	userRepo *repository.AdminUserRepo,
	providerRepo *repository.AdminProviderRepo,
	modelRepo *repository.AdminModelRepo,
	billingRepo *repository.AdminBillingRepo,
	settingsRepo *repository.AdminSettingsRepo,
	auditRepo *repository.AdminAuditRepo,
	securityRepo *repository.AdminSecurityRepo,
	featuresRepo *repository.AdminFeaturesRepo,
	auditSvc *AuditService,
) *AdminService {
	return &AdminService{
		userRepo: userRepo, providerRepo: providerRepo, modelRepo: modelRepo,
		billingRepo: billingRepo, settingsRepo: settingsRepo, auditRepo: auditRepo,
		securityRepo: securityRepo, featuresRepo: featuresRepo, auditSvc: auditSvc,
	}
}

// SetLLMRuntime injects the LLM registry, cache, and watcher so admin
// provider CRUD can hot-register providers at runtime.
func (s *AdminService) SetLLMRuntime(reg *llmprovider.Registry, c cache.Cache, w *watcher.Watcher) {
	s.llmRegistry = reg
	s.llmCache = c
	s.llmWatcher = w
}

// SetKeyEncryptionSecret configures AES-GCM for durable provider API key storage.
// Secret is typically AUTH_SECRET (hashed to 32 bytes).
func (s *AdminService) SetKeyEncryptionSecret(secret string) {
	if secret == "" {
		return
	}
	key := sha256.Sum256([]byte(secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		logger.Error("provider_key_cipher_init_failed", "error", err.Error())
		return
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		logger.Error("provider_key_gcm_init_failed", "error", err.Error())
		return
	}
	s.keyCipher = aead
}

func (s *AdminService) encryptProviderKey(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	if s.keyCipher == nil {
		return "", fmt.Errorf("provider key encryption is not configured")
	}
	nonce := make([]byte, s.keyCipher.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := s.keyCipher.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *AdminService) decryptProviderKey(encoded string) (string, error) {
	if encoded == "" {
		return "", fmt.Errorf("empty encrypted key")
	}
	if s.keyCipher == nil {
		return "", fmt.Errorf("provider key encryption is not configured")
	}
	raw, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("decode encrypted key: %w", err)
	}
	nonceSize := s.keyCipher.NonceSize()
	if len(raw) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := raw[:nonceSize], raw[nonceSize:]
	plain, err := s.keyCipher.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt key: %w", err)
	}
	return string(plain), nil
}

// storeRawKey saves the raw API key in memory keyed by provider-key ID.
func (s *AdminService) storeRawKey(keyID, rawKey string) {
	s.rawKeyStore.Store(keyID, rawKey)
}

// getRawKey retrieves a stored raw API key by provider-key ID.
func (s *AdminService) getRawKey(keyID string) (string, bool) {
	v, ok := s.rawKeyStore.Load(keyID)
	if !ok {
		return "", false
	}
	return v.(string), true
}

// deleteRawKey removes a stored raw API key.
func (s *AdminService) deleteRawKey(keyID string) {
	s.rawKeyStore.Delete(keyID)
}

// getActiveRawKeyForProvider finds the first active raw API key for a provider.
// Prefers in-memory cache; falls back to decrypting encrypted_key from DB.
func (s *AdminService) getActiveRawKeyForProvider(ctx context.Context, providerID string) string {
	keys, err := s.providerRepo.ListKeys(ctx, providerID)
	if err != nil {
		return ""
	}
	for _, k := range keys {
		if !k.IsActive {
			continue
		}
		if raw, ok := s.getRawKey(k.ID); ok {
			return raw
		}
		if k.EncryptedKey == "" {
			continue
		}
		raw, err := s.decryptProviderKey(k.EncryptedKey)
		if err != nil {
			logger.Warn("provider_key_decrypt_failed", "key_id", k.ID, "error", err.Error())
			continue
		}
		s.storeRawKey(k.ID, raw)
		return raw
	}
	return ""
}

// LoadProvidersFromDB loads all active providers from the database and registers
// them with the LLM runtime at startup. Encrypted keys are decrypted into the
// in-memory store so chat works after restart without re-entering keys.
func (s *AdminService) LoadProvidersFromDB(ctx context.Context, reg *llmprovider.Registry) {
	if reg == nil {
		return
	}
	providers, err := s.providerRepo.List(ctx)
	if err != nil {
		logger.Error("load_providers_from_db_failed", "error", err.Error())
		return
	}
	loadedWithKey := 0
	loadedWithoutKey := 0
	for _, p := range providers {
		if p.Status != domain.ProviderStatusActive || p.BaseURL == "" {
			continue
		}
		if p.ProviderType == "builtin" {
			continue // already registered at startup via initProviderRegistry
		}
		rawKey := s.getActiveRawKeyForProvider(ctx, p.ID)
		if rawKey != "" {
			s.registerProviderRuntime(&p, rawKey)
			loadedWithKey++
		} else {
			s.registerProviderRuntime(&p)
			loadedWithoutKey++
		}
	}
	logger.Info("admin_providers_loaded",
		"count", len(providers),
		"with_key", loadedWithKey,
		"without_key", loadedWithoutKey,
	)
}

// EnsureBuiltinProviders creates DB entries for known LLM-registered providers
// that don't yet have a row in the providers table. This allows admins to
// manage models for built-in providers via the admin UI.
func (s *AdminService) EnsureBuiltinProviders(ctx context.Context) {
	if s.llmRegistry == nil {
		return
	}
	for _, name := range s.llmRegistry.Providers() {
		existing, err := s.providerRepo.GetByName(ctx, name)
		if err != nil {
			logger.Warn("ensure_builtin_provider_lookup_failed", "provider", name, "error", err.Error())
			continue
		}
		if existing != nil {
			continue
		}
		displayName := name
		if c := displayName[0]; c >= 'a' && c <= 'z' {
			// ASCII-lowercase first letter: capitalize it. Only subtract 32
			// in the lowercase range — the old `displayName[0]-32` cast
			// produced garbage runes for names already uppercase, numeric, or
			// multi-byte (e.g. "1provider", "OpenAI").
			displayName = string(c-32) + displayName[1:]
		}
		p := &domain.Provider{
			ID:           domain.NewID(),
			Name:         name,
			DisplayName:  displayName,
			ProviderType: "builtin",
			Status:       domain.ProviderStatusActive,
		}
		if err := s.providerRepo.Create(ctx, p); err != nil {
			logger.Warn("ensure_builtin_provider_create_failed", "provider", name, "error", err.Error())
		} else {
			logger.Info("builtin_provider_seeded", "provider", name, "id", p.ID)
		}
	}
}

// syncModelRegistryOverlay loads all model_registry entries and pushes
// a status overlay to the LLM registry so that /v1/models reflects
// the admin's model management decisions.
func (s *AdminService) SyncModelRegistryOverlay(ctx context.Context) {
	if s.llmRegistry == nil {
		return
	}
	models, err := s.modelRepo.ListModels(ctx, "")
	if err != nil {
		logger.Warn("sync_model_overlay_failed", "error", err.Error())
		return
	}

	providers, err := s.providerRepo.List(ctx)
	if err != nil {
		logger.Warn("sync_model_overlay_providers_failed", "error", err.Error())
		return
	}
	providerNameByID := make(map[string]string, len(providers))
	for _, p := range providers {
		providerNameByID[p.ID] = p.Name
	}

	overlay := make(map[string]llmprovider.ModelOverlayEntry, len(models))
	for _, m := range models {
		provName := providerNameByID[m.ProviderID]
		if provName == "" {
			continue
		}
		key := provName + "/" + m.ModelID
		overlay[key] = llmprovider.ModelOverlayEntry{
			Status:      string(m.Status),
			DisplayName: m.DisplayName,
		}
	}
	s.llmRegistry.SetModelOverlay(overlay)
	logger.Info("model_overlay_synced", "entries", len(overlay))
}

// ─── Users ───

func (s *AdminService) ListUsers(ctx context.Context, filter domain.UserFilter) ([]domain.AdminUserDetail, int, error) {
	return s.userRepo.ListUsers(ctx, filter)
}

func (s *AdminService) GetUser(ctx context.Context, id string) (*domain.AdminUserDetail, error) {
	return s.userRepo.GetUser(ctx, id)
}

func (s *AdminService) UpdateUserStatus(ctx context.Context, userID, status, reason string) error {
	return s.userRepo.UpdateUserStatus(ctx, userID, status, reason, "")
}

func (s *AdminService) UpdateUserRole(ctx context.Context, userID, role string) error {
	return s.userRepo.UpdateUserRole(ctx, userID, role)
}

func (s *AdminService) DeleteUser(ctx context.Context, userID string) error {
	return s.userRepo.SoftDelete(ctx, userID)
}

// ListAdminUsers returns all active admin users.
func (s *AdminService) ListAdminUsers(ctx context.Context) ([]domain.AdminUser, error) {
	return s.userRepo.ListAdminUsers(ctx)
}

// CreateAdminUser creates or reactivates an admin user.
func (s *AdminService) CreateAdminUser(ctx context.Context, userID, role string) error {
	return s.userRepo.CreateAdminUser(ctx, userID, role, "")
}

// RemoveAdmin deactivates an admin user.
func (s *AdminService) RemoveAdmin(ctx context.Context, userID string) error {
	return s.userRepo.RemoveAdmin(ctx, userID)
}

// ─── Providers ───

func (s *AdminService) ListProviders(ctx context.Context) ([]domain.Provider, error) {
	return s.providerRepo.List(ctx)
}

func (s *AdminService) GetProvider(ctx context.Context, id string) (*domain.Provider, error) {
	return s.providerRepo.Get(ctx, id)
}

func (s *AdminService) CreateProvider(ctx context.Context, p *domain.Provider) error {
	if err := s.providerRepo.Create(ctx, p); err != nil {
		return err
	}
	// Hot-register with LLM runtime if registry is available
	if s.llmRegistry != nil && p.BaseURL != "" {
		s.registerProviderRuntime(p)
	}
	return nil
}

// CreateProviderFull creates a provider with an optional API key and models,
// then registers it with the LLM runtime in one step.
func (s *AdminService) CreateProviderFull(ctx context.Context, p *domain.Provider, apiKey string, models []domain.ModelRegistry) error {
	if p.ID == "" {
		p.ID = domain.NewID()
	}
	if p.Status == "" {
		p.Status = domain.ProviderStatusActive
	}
	if p.ProviderType == "" {
		p.ProviderType = "openai"
	}

	// Pre-derive the key material before opening the transaction so a cipher
	// failure doesn't leave a half-open DB transaction.
	var key *domain.ProviderKey
	if apiKey != "" {
		prefix, lastFour, hash := deriveKeyParts(apiKey)
		enc, err := s.encryptProviderKey(apiKey)
		if err != nil {
			return fmt.Errorf("encrypt api key: %w", err)
		}
		key = &domain.ProviderKey{
			ID:           domain.NewID(),
			ProviderID:   p.ID,
			Label:        "primary",
			KeyPrefix:    prefix,
			KeyHash:      hash,
			KeyLastFour:  lastFour,
			EncryptedKey: enc,
			IsActive:     true,
			Strategy:     domain.KeyStrategyRoundRobin,
		}
	}

	// Assign IDs + defaults to models up front so the transaction only does writes.
	for i := range models {
		if models[i].ID == "" {
			models[i].ID = domain.NewID()
		}
		models[i].ProviderID = p.ID
		if models[i].Status == "" {
			models[i].Status = domain.ModelStatusActive
		}
	}

	// Atomic write: provider + key + models commit together. If any step fails
	// the whole thing rolls back instead of orphaning a provider row with no key
	// (the previous non-transactional path left partial state on failure).
	tx, err := s.providerRepo.DB().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) // safe no-op after Commit

	if err := s.providerRepo.CreateTx(ctx, tx, p); err != nil {
		return err
	}
	if key != nil {
		if err := s.providerRepo.CreateKeyTx(ctx, tx, key); err != nil {
			return err
		}
	}
	for i := range models {
		if err := s.modelRepo.CreateModelTx(ctx, tx, &models[i]); err != nil {
			return fmt.Errorf("store model %s: %w", models[i].ModelID, err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit provider: %w", err)
	}

	// Post-commit side effects: caches + in-memory key store + runtime.
	// These are not rolled back with the DB tx, so only run after success.
	if key != nil {
		s.storeRawKey(key.ID, apiKey)
	}
	s.providerRepo.InvalidateProviderCaches(ctx, p.ID)

	// Register with LLM runtime
	if s.llmRegistry != nil && p.BaseURL != "" {
		s.registerProviderRuntime(p, apiKey)
	}

	// Keep /v1/models and public catalog overlay in sync with new rows.
	s.SyncModelRegistryOverlay(ctx)

	return nil
}

// AddProviderKeyRaw stores a provider key and registers it with the runtime.
func (s *AdminService) AddProviderKeyRaw(ctx context.Context, k *domain.ProviderKey, rawKey string) error {
	if k.ID == "" {
		k.ID = domain.NewID()
	}
	if k.Strategy == "" {
		k.Strategy = domain.KeyStrategyRoundRobin
	}
	if k.Weight == 0 {
		k.Weight = 1
	}
	if !k.IsActive {
		k.IsActive = true
	}
	prefix, lastFour, hash := deriveKeyParts(rawKey)
	k.KeyPrefix = prefix
	k.KeyHash = hash
	k.KeyLastFour = lastFour
	if rawKey != "" {
		enc, err := s.encryptProviderKey(rawKey)
		if err != nil {
			return fmt.Errorf("encrypt api key: %w", err)
		}
		k.EncryptedKey = enc
	}
	if err := s.providerRepo.CreateKey(ctx, k); err != nil {
		return err
	}
	// Store raw key in memory for future hot-reloads
	if rawKey != "" {
		s.storeRawKey(k.ID, rawKey)
	}
	// Re-register provider with the key for runtime use
	if rawKey != "" && s.llmRegistry != nil {
		p, err := s.providerRepo.Get(ctx, k.ProviderID)
		if err == nil && p != nil {
			s.registerProviderRuntime(p, rawKey)
		}
	}
	return nil
}

func (s *AdminService) UpdateProvider(ctx context.Context, p *domain.Provider) error {
	if err := s.providerRepo.Update(ctx, p); err != nil {
		return err
	}
	// Hot-reload: re-register provider with updated config
	if s.llmRegistry != nil {
		refreshed, err := s.providerRepo.Get(ctx, p.ID)
		if err == nil && refreshed != nil {
			if refreshed.Status == domain.ProviderStatusActive && refreshed.BaseURL != "" {
				rawKey := s.getActiveRawKeyForProvider(ctx, refreshed.ID)
				if rawKey != "" {
					s.registerProviderRuntime(refreshed, rawKey)
				} else {
					s.registerProviderRuntime(refreshed)
				}
			} else {
				s.unregisterProviderRuntime(refreshed.Name)
			}
		}
	}
	return nil
}

func (s *AdminService) ToggleProviderStatus(ctx context.Context, id string, status domain.ProviderStatus) error {
	if err := s.providerRepo.UpdateStatus(ctx, id, status); err != nil {
		return err
	}
	// Hot-swap: register or unregister based on new status
	if s.llmRegistry != nil {
		p, err := s.providerRepo.Get(ctx, id)
		if err == nil && p != nil {
			if status == domain.ProviderStatusActive && p.BaseURL != "" {
				rawKey := s.getActiveRawKeyForProvider(ctx, p.ID)
				if rawKey != "" {
					s.registerProviderRuntime(p, rawKey)
				} else {
					s.registerProviderRuntime(p)
				}
			} else {
				s.unregisterProviderRuntime(p.Name)
			}
		}
	}
	return nil
}

// DeleteProvider removes a provider, its keys, and unregisters from runtime.
func (s *AdminService) DeleteProvider(ctx context.Context, id string) error {
	p, err := s.providerRepo.Get(ctx, id)
	if err != nil {
		return err
	}
	if p == nil {
		return fmt.Errorf("provider not found: %s", id)
	}
	s.unregisterProviderRuntime(p.Name)
	keys, err := s.providerRepo.ListKeys(ctx, id)
	if err != nil {
		logger.Warn("delete_provider_list_keys_failed", "provider_id", id, "error", err.Error())
	}
	for _, k := range keys {
		s.deleteRawKey(k.ID)
		if err := s.providerRepo.DeleteKey(ctx, k.ID); err != nil {
			logger.Warn("delete_provider_key_failed", "key_id", k.ID, "error", err.Error())
		}
	}
	if err := s.providerRepo.Delete(ctx, id); err != nil {
		return err
	}
	// Cascade removes model_registry rows; refresh overlay so catalog drops them.
	s.SyncModelRegistryOverlay(ctx)
	return nil
}

// registerProviderRuntime creates a GenericProvider from DB config and registers it.
// If apiKey is provided, the provider is registered with authentication.
func (s *AdminService) registerProviderRuntime(p *domain.Provider, apiKey ...string) {
	if s.llmRegistry == nil {
		return
	}
	opts := []llmprovider.Option{
		llmprovider.WithBaseURL(p.BaseURL),
	}
	if len(apiKey) > 0 && apiKey[0] != "" {
		opts = append(opts, llmprovider.WithAPIKey(apiKey[0]))
	}
	if s.llmCache != nil {
		opts = append(opts, llmprovider.WithCache(s.llmCache))
	}
	if s.llmWatcher != nil {
		opts = append(opts, llmprovider.WithWatcher(s.llmWatcher))
	}

	// Build model list from model_registry for this provider
	models, mErr := s.modelRepo.ListModelsByProvider(context.Background(), p.ID)
	if mErr == nil && len(models) > 0 {
		llmModels := make([]llm.ModelInfo, 0, len(models))
		for _, m := range models {
			llmModels = append(llmModels, llm.ModelInfo{
				ID:               fmt.Sprintf("%s/%s", p.Name, m.ModelID),
				Name:             m.DisplayName,
				Provider:         p.Name,
				InputPricePer1k:  m.InputPricePer1k,
				OutputPricePer1k: m.OutputPricePer1k,
				ContextWindow:    m.ContextWindow,
				Description:      m.Description,
				Capabilities:     m.Capabilities,
				SupportsVision:   m.SupportsVision,
				SupportsTools:    m.SupportsTools,
				SupportsThinking: m.SupportsThinking,
			})
		}
		opts = append(opts, llmprovider.WithModels(llmModels))
	}

	prov := llmprovider.NewGenericProvider(p.Name, p.BaseURL, opts...)
	s.llmRegistry.Register(prov)
	s.llmRegistry.InvalidateCache()
	// Fan out to router/load-balancer/health-checker so the new provider is
	// live immediately — no server restart required.
	s.syncRuntimeAdd(prov)
	logger.Info("admin_provider_registered_runtime", "provider", p.Name, "base_url", p.BaseURL, "has_key", len(apiKey) > 0 && apiKey[0] != "")
}

// ─── Provider Keys ───

func (s *AdminService) ListProviderKeys(ctx context.Context, providerID string) ([]domain.ProviderKey, error) {
	return s.providerRepo.ListKeys(ctx, providerID)
}

func (s *AdminService) AddProviderKey(ctx context.Context, k *domain.ProviderKey) error {
	if err := s.providerRepo.CreateKey(ctx, k); err != nil {
		return err
	}
	// Re-register provider if this key is active and we have a raw key in memory.
	// Callers who have the raw key should use AddProviderKeyRaw instead.
	if k.IsActive && s.llmRegistry != nil {
		p, err := s.providerRepo.Get(ctx, k.ProviderID)
		if err == nil && p != nil && p.BaseURL != "" {
			rawKey := s.getActiveRawKeyForProvider(ctx, p.ID)
			if rawKey != "" {
				s.registerProviderRuntime(p, rawKey)
			} else {
				s.registerProviderRuntime(p)
			}
		}
	}
	return nil
}

func (s *AdminService) UpdateProviderKey(ctx context.Context, k *domain.ProviderKey) error {
	return s.providerRepo.UpdateKey(ctx, k)
}

func (s *AdminService) DeleteProviderKey(ctx context.Context, providerID, keyID string) error {
	s.deleteRawKey(keyID)

	if err := s.providerRepo.DeleteKey(ctx, keyID); err != nil {
		return err
	}

	// Refresh provider in runtime (may need to pick up a different key)
	if providerID != "" {
		s.refreshProviderModels(ctx, providerID)
	}
	return nil
}

func (s *AdminService) ReorderProviderKeys(ctx context.Context, providerID string, keyIDs []string) error {
	return s.providerRepo.ReorderKeys(ctx, providerID, keyIDs)
}

// SetKeyStatus toggles whether a single provider key is included in the
// runtime key rotation. Flipping is_active triggers a runtime re-register
// via refreshProviderModels so the LLM gateway's load-balancer picks up
// the new active set immediately — without it, an enable could land in
// the DB but the gateway would still be using the in-memory pre-flip set.
func (s *AdminService) SetKeyStatus(ctx context.Context, providerID, keyID string, isActive bool) error {
	if err := s.providerRepo.SetKeyStatus(ctx, providerID, keyID, isActive); err != nil {
		return err
	}
	s.refreshProviderModels(ctx, providerID)
	return nil
}

func (s *AdminService) GetProviderHealth(ctx context.Context, providerID string, since time.Time) ([]domain.ProviderHealthCheck, error) {
	return s.providerRepo.GetHealthChecks(ctx, providerID, since)
}

// ─── Models ───

func (s *AdminService) ListModels(ctx context.Context, status string) ([]domain.ModelRegistry, error) {
	return s.modelRepo.ListModels(ctx, status)
}

func (s *AdminService) GetModel(ctx context.Context, id string) (*domain.ModelRegistry, error) {
	return s.modelRepo.GetModel(ctx, id)
}

func (s *AdminService) CreateModel(ctx context.Context, m *domain.ModelRegistry) error {
	// Mirrors the provider-bulk path (admin.go:391) — clients always submit
	// without an `id`; assigning the primary key here keeps the PK UNIQUE
	// invariant on the second-create UNIQUE-constraint failure that
	// SQLite exhibits on `""` (and Postgres on the same repeated key).
	if m.ID == "" {
		m.ID = domain.NewID()
	}
	if m.Status == "" {
		m.Status = domain.ModelStatusActive
	}
	if err := s.modelRepo.CreateModel(ctx, m); err != nil {
		return err
	}
	s.SyncModelRegistryOverlay(ctx)
	s.refreshProviderModels(ctx, m.ProviderID)
	return nil
}

func (s *AdminService) UpdateModel(ctx context.Context, m *domain.ModelRegistry) error {
	if err := s.modelRepo.UpdateModel(ctx, m); err != nil {
		return err
	}
	s.SyncModelRegistryOverlay(ctx)
	s.refreshProviderModels(ctx, m.ProviderID)
	return nil
}

func (s *AdminService) UpdateModelStatus(ctx context.Context, id string, status domain.ModelStatus, replacementID *string) error {
	m, err := s.modelRepo.GetModel(ctx, id)
	if err != nil || m == nil {
		return fmt.Errorf("model not found: %s", id)
	}
	if err := s.modelRepo.UpdateModelStatus(ctx, id, status, replacementID); err != nil {
		return err
	}
	s.SyncModelRegistryOverlay(ctx)
	s.refreshProviderModels(ctx, m.ProviderID)
	return nil
}

// DeleteModel removes a model and refreshes the provider's runtime model list.
func (s *AdminService) DeleteModel(ctx context.Context, id string) error {
	m, err := s.modelRepo.GetModel(ctx, id)
	if err != nil || m == nil {
		return fmt.Errorf("model not found: %s", id)
	}
	if err := s.modelRepo.DeleteModel(ctx, id); err != nil {
		return err
	}
	s.SyncModelRegistryOverlay(ctx)
	s.refreshProviderModels(ctx, m.ProviderID)
	return nil
}

// refreshProviderModels rebuilds the provider's model list in the LLM registry.
func (s *AdminService) refreshProviderModels(ctx context.Context, providerID string) {
	if s.llmRegistry == nil {
		return
	}
	p, err := s.providerRepo.Get(ctx, providerID)
	if err != nil || p == nil || p.Status != domain.ProviderStatusActive || p.BaseURL == "" {
		return
	}
	rawKey := s.getActiveRawKeyForProvider(ctx, p.ID)
	if rawKey != "" {
		s.registerProviderRuntime(p, rawKey)
	} else {
		s.registerProviderRuntime(p)
	}
}

// ─── Aliases ───

func (s *AdminService) ListAliases(ctx context.Context) ([]domain.ModelAlias, error) {
	return s.modelRepo.ListAliases(ctx)
}

func (s *AdminService) CreateAlias(ctx context.Context, a *domain.ModelAlias) error {
	if a.ID == "" {
		a.ID = domain.NewID()
	}
	return s.modelRepo.CreateAlias(ctx, a)
}

func (s *AdminService) UpdateAlias(ctx context.Context, a *domain.ModelAlias) error {
	return s.modelRepo.UpdateAlias(ctx, a)
}

func (s *AdminService) DeleteAlias(ctx context.Context, id string) error {
	return s.modelRepo.DeleteAlias(ctx, id)
}

// ─── Billing ───

func (s *AdminService) AdjustCredits(ctx context.Context, adj *domain.CreditAdjustment) error {
	return s.billingRepo.AdjustCredits(ctx, adj)
}

func (s *AdminService) ListAdjustments(ctx context.Context, userID string, page, limit int) ([]domain.CreditAdjustment, int, error) {
	return s.billingRepo.ListAdjustments(ctx, userID, page, limit)
}

func (s *AdminService) RevenueSummary(ctx context.Context, from, to time.Time) ([]domain.RevenueSummary, error) {
	return s.billingRepo.RevenueSummary(ctx, from, to)
}

func (s *AdminService) ListUsageRecords(ctx context.Context, f domain.UsageFilter) ([]domain.UsageRecord, int, error) {
	return s.billingRepo.UsageRecords(ctx, f)
}

func (s *AdminService) UsageDaily(ctx context.Context, from, to time.Time, groupBy string) ([]domain.UsageDaily, error) {
	return s.billingRepo.UsageDaily(ctx, from, to, groupBy)
}

// ─── Settings ───

func (s *AdminService) ListSettings(ctx context.Context, group string) ([]domain.SystemSetting, error) {
	return s.settingsRepo.List(ctx, group)
}

func (s *AdminService) GetSetting(ctx context.Context, key string) (*domain.SystemSetting, error) {
	return s.settingsRepo.Get(ctx, key)
}

func (s *AdminService) UpdateSetting(ctx context.Context, setting *domain.SystemSetting) error {
	return s.settingsRepo.Set(ctx, setting)
}

func (s *AdminService) ListFeatureFlags(ctx context.Context) ([]domain.FeatureFlag, error) {
	return s.settingsRepo.ListFeatureFlags(ctx)
}

func (s *AdminService) CreateFeatureFlag(ctx context.Context, f *domain.FeatureFlag) error {
	return s.settingsRepo.CreateFeatureFlag(ctx, f)
}

func (s *AdminService) ToggleFeatureFlag(ctx context.Context, id string, enabled bool) error {
	return s.settingsRepo.UpdateFeatureFlag(ctx, id, enabled)
}

// ─── Audit ───

func (s *AdminService) ListAuditLogs(ctx context.Context, filter domain.AuditLogFilter) ([]domain.AuditLog, int, error) {
	return s.auditRepo.List(ctx, filter)
}

// ─── Security ───

func (s *AdminService) ListSuspicious(ctx context.Context, f domain.SuspiciousFilter) ([]domain.SuspiciousActivity, int, error) {
	return s.securityRepo.ListSuspicious(ctx, f)
}

func (s *AdminService) ReviewSuspicious(ctx context.Context, id int64, action string, reviewerID string) error {
	return s.securityRepo.ReviewSuspicious(ctx, id, action, reviewerID)
}

func (s *AdminService) AddIPEntry(ctx context.Context, e *domain.IPList) error {
	return s.securityRepo.AddIPEntry(ctx, e)
}

func (s *AdminService) ListIPEntries(ctx context.Context, action string) ([]domain.IPList, error) {
	return s.securityRepo.ListIPEntries(ctx, action)
}

func (s *AdminService) RemoveIPEntry(ctx context.Context, id string) error {
	return s.securityRepo.RemoveIPEntry(ctx, id)
}

func (s *AdminService) StartImpersonation(ctx context.Context, adminID, userID, reason string) (*domain.ImpersonationSession, error) {
	return s.securityRepo.StartImpersonation(ctx, adminID, userID, reason)
}

func (s *AdminService) EndImpersonation(ctx context.Context, id string) error {
	return s.securityRepo.EndImpersonation(ctx, id)
}

func (s *AdminService) ListIPAccessLogs(ctx context.Context, f domain.IPAccessLogFilter) ([]domain.IPAccessLog, int, error) {
	return s.securityRepo.ListIPAccessLogs(ctx, f)
}

// ─── Features ───

func (s *AdminService) ListAnnouncements(ctx context.Context) ([]domain.Announcement, error) {
	return s.featuresRepo.ListAnnouncements(ctx)
}

func (s *AdminService) CreateAnnouncement(ctx context.Context, a *domain.Announcement) error {
	return s.featuresRepo.CreateAnnouncement(ctx, a)
}

func (s *AdminService) ListPromoCodes(ctx context.Context) ([]domain.PromoCode, error) {
	return s.featuresRepo.ListPromoCodes(ctx)
}

func (s *AdminService) CreatePromoCode(ctx context.Context, p *domain.PromoCode) error {
	return s.featuresRepo.CreatePromoCode(ctx, p)
}

// TogglePromoStatus updates the active status of a promo code.
func (s *AdminService) TogglePromoStatus(ctx context.Context, id string, isActive bool) error {
	return s.featuresRepo.TogglePromoStatus(ctx, id, isActive)
}

func (s *AdminService) GetPromoRedemptions(ctx context.Context, promoID string) ([]domain.PromoRedemption, error) {
	return s.featuresRepo.GetPromoRedemptions(ctx, promoID)
}

func (s *AdminService) RedeemPromoCode(ctx context.Context, code, userID string) (*domain.PromoRedemption, int, error) {
	return s.featuresRepo.RedeemPromo(ctx, code, userID)
}

func (s *AdminService) ListGroups(ctx context.Context) ([]domain.UserGroup, error) {
	return s.featuresRepo.ListGroups(ctx)
}

func (s *AdminService) CreateGroup(ctx context.Context, g *domain.UserGroup) error {
	return s.featuresRepo.CreateGroup(ctx, g)
}

func (s *AdminService) ListScheduledReports(ctx context.Context) ([]domain.ScheduledReport, error) {
	return s.featuresRepo.ListScheduledReports(ctx)
}

func (s *AdminService) CreateScheduledReport(ctx context.Context, r *domain.ScheduledReport) error {
	return s.featuresRepo.CreateScheduledReport(ctx, r)
}

func (s *AdminService) ListChangelog(ctx context.Context, drafts bool) ([]domain.ChangelogEntry, error) {
	return s.featuresRepo.ListChangelog(ctx, drafts)
}

func (s *AdminService) CreateChangelog(ctx context.Context, e *domain.ChangelogEntry) error {
	return s.featuresRepo.CreateChangelog(ctx, e)
}

func (s *AdminService) PublishChangelog(ctx context.Context, id string) error {
	return s.featuresRepo.PublishChangelog(ctx, id)
}

func (s *AdminService) ListSSOConfigs(ctx context.Context) ([]domain.SSOConfig, error) {
	return s.featuresRepo.ListSSOConfigs(ctx)
}

// deriveKeyParts splits a raw API key into a display prefix, last-four chars,
// and a SHA-256 hash for storage. The raw key is also AES-GCM encrypted into
// provider_keys.encrypted_key for restart-safe runtime use.
func deriveKeyParts(rawKey string) (prefix, lastFour, hash string) {
	if rawKey == "" {
		return "", "", ""
	}
	prefixLen := 8
	if len(rawKey) < prefixLen {
		prefixLen = len(rawKey)
	}
	prefix = rawKey[:prefixLen]
	if len(rawKey) >= 4 {
		lastFour = rawKey[len(rawKey)-4:]
	} else {
		lastFour = rawKey
	}
	h := sha256.Sum256([]byte(rawKey))
	hash = hex.EncodeToString(h[:])
	return
}
