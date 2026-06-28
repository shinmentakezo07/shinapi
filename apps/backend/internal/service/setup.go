package service

import (
	"context"
	"sync"

	"dra-platform/backend/internal/pkg/logger"
	"dra-platform/backend/internal/pkg/password"
	"dra-platform/backend/internal/repository"
)

// SetupService orchestrates the first-time bootstrap flow. It owns an
// in-memory bool (needsSetup) seeded from the DB on boot and flipped to
// false exactly once when the first admin is created. Subsequent
// /api/setup/bootstrap requests are rejected at this layer via
// repository.ErrFirstAdminAlreadyExists — the absence of an admin is
// the only authorization the bootstrap endpoint accepts.
type SetupService struct {
	setupRepo *repository.SetupRepo

	mu         sync.RWMutex
	needsSetup bool
}

func NewSetupService(repo *repository.SetupRepo) *SetupService {
	return &SetupService{setupRepo: repo, needsSetup: true}
}

// Init seeds the flag from the database. Called once after migrations
// have run on application boot.
func (s *SetupService) Init(ctx context.Context) error {
	n, err := s.setupRepo.CountAdmins(ctx)
	if err != nil {
		return err
	}
	s.setNeedsSetup(n == 0)
	logger.Info("setup_service_initialized", "needs_setup", n == 0, "admin_count", n)
	return nil
}

// NeedsSetup returns true when no admin row exists in the DB.
func (s *SetupService) NeedsSetup() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.needsSetup
}

func (s *SetupService) setNeedsSetup(v bool) {
	s.mu.Lock()
	s.needsSetup = v
	s.mu.Unlock()
}

// Bootstrap hashes the password, delegates to the repo (which holds the
// advisory lock + transactional safety), then flips the in-memory flag
// to false. Returns the new admin's user ID.
func (s *SetupService) Bootstrap(ctx context.Context, name, email, plainPassword string) (string, error) {
	hash, err := password.Hash(plainPassword)
	if err != nil {
		return "", err
	}
	id, err := s.setupRepo.CreateFirstAdmin(ctx, name, email, hash)
	if err != nil {
		return "", err
	}
	s.setNeedsSetup(false)
	logger.Info("first_admin_created", "user_id", id, "email", email)
	return id, nil
}
