package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"dra-platform/backend/internal/pkg/logger"
	"dra-platform/backend/internal/pkg/response"
	"dra-platform/backend/internal/repository"
	"dra-platform/backend/internal/service"
)

// SetupHandler serves the unauthenticated first-time-bootstrap endpoints.
// The bootstrap endpoint is intentionally mounted outside any auth-required
// router group — the absence of an admin account is the only authorization
// it accepts, gated by service.SetupService.Bootstrap which honors
// repository.ErrFirstAdminAlreadyExists as a hard 403.
type SetupHandler struct {
	setupSvc *service.SetupService
}

func NewSetupHandler(svc *service.SetupService) *SetupHandler {
	return &SetupHandler{setupSvc: svc}
}

// GET /api/setup/status
func (h *SetupHandler) Status(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]bool{"needsSetup": h.setupSvc.NeedsSetup()})
}

// POST /api/setup/bootstrap — public, gated only by "no admin exists yet".
func (h *SetupHandler) Bootstrap(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid body")
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if len(name) < 2 {
		response.Error(w, http.StatusBadRequest, "Name must be at least 2 characters")
		return
	}
	if !strings.Contains(email, "@") || len(email) < 3 {
		response.Error(w, http.StatusBadRequest, "Please enter a valid email address")
		return
	}
	if len(req.Password) < 6 {
		response.Error(w, http.StatusBadRequest, "Password must be at least 6 characters")
		return
	}

	userID, err := h.setupSvc.Bootstrap(r.Context(), name, email, req.Password)
	if err != nil {
		if errors.Is(err, repository.ErrFirstAdminAlreadyExists) {
			response.Error(w, http.StatusForbidden, "An admin account already exists. Please sign in instead.")
			return
		}
		// Log the full error server-side so on-call can diagnose.
		logger.Error("first_admin_bootstrap_failed", "error", err.Error())

		// Map common, expose-friendly cases to specific HTTP codes + copy.
		msg := err.Error()
		switch {
		case strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique") || strings.Contains(msg, "UNIQUE constraint failed"):
			response.Error(w, http.StatusConflict, "That email is already in use")
			return
		case strings.Contains(msg, "no such table") || strings.Contains(msg, "relation") && strings.Contains(msg, "does not exist") || strings.Contains(msg, "undefined_table"):
			// Most likely SQLite lite DDL is missing admin_* tables, OR the PG migration
			// that creates them (007_admin_schema.sql) wasn't applied.
			response.Error(w, http.StatusInternalServerError, "Database schema is out of date — the admin_users table is missing. Run migrations 001-007.")
			return
		case strings.Contains(msg, "foreign key") || strings.Contains(msg, "FOREIGN KEY constraint failed"):
			response.Error(w, http.StatusInternalServerError, "Database foreign-key mismatch during bootstrap. Check migrations and try again.")
			return
		case strings.Contains(msg, "password") && strings.Contains(msg, "hash"):
			response.Error(w, http.StatusInternalServerError, "Password hashing failed on the server. Check the password module and try again.")
			return
		}

		// Unknown error — surface a sanitized snippet to the caller so the
		// UX banner is not generic. Cap at 240 chars to keep the JSON envelope small
		// and prevent log noise from very long driver errors.
		snippet := msg
		if len(snippet) > 240 {
			snippet = snippet[:240] + "…"
		}
		response.Error(w, http.StatusInternalServerError, "Could not create the first admin: "+snippet)
		return
	}

	response.OK(w, map[string]any{
		"user": map[string]string{
			"id":    userID,
			"email": email,
			"name":  name,
		},
	})
}
