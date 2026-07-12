package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"dra-platform/backend/internal/testutil"
)

// TestRBAC_UpdateUserRolePrivilegeEscalation guards against the vulnerability
// where PUT /api/admin/users/{userId}/role allowed any admin to grant the
// superadmin role without a superadmin-only guard, enabling privilege escalation.
func TestRBAC_UpdateUserRolePrivilegeEscalation(t *testing.T) {
	testutil.SkipIfNoDB(t)

	ts, db, err := testutil.NewTestServer()
	if err != nil {
		t.Fatalf("failed to create test server: %v", err)
	}
	defer ts.Close()
	defer db.Close()

	if err := testutil.CleanTables(db); err != nil {
		t.Fatalf("failed to clean tables: %v", err)
	}

	admin, err := testutil.SeedAdmin(db, "Admin", "admin@example.com", "password123")
	if err != nil {
		t.Fatalf("failed to seed admin: %v", err)
	}
	target, err := testutil.SeedUser(db, "Target", "target@example.com", "password123")
	if err != nil {
		t.Fatalf("failed to seed target user: %v", err)
	}

	adminJWT := testutil.GenerateTestJWTWithRole(admin.ID, admin.Email, admin.Name, "admin")
	client := &http.Client{}

	// RED: a plain admin must NOT be able to grant superadmin.
	body := map[string]string{"role": "superadmin"}
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPut, ts.URL+"/api/admin/users/"+target.ID+"/role", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+adminJWT)
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("role update request failed: %v", err)
	}
	respBody := testutil.MustReadBody(resp)
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 when non-superadmin grants superadmin, got %d: %s", resp.StatusCode, respBody)
	}

	// A superadmin IS allowed to grant superadmin.
	super, err := testutil.SeedSuperAdmin(db, "Super", "super@example.com", "password123")
	if err != nil {
		t.Fatalf("failed to seed superadmin: %v", err)
	}
	superJWT := testutil.GenerateTestJWTWithRole(super.ID, super.Email, super.Name, "superadmin")
	req, _ = http.NewRequest(http.MethodPut, ts.URL+"/api/admin/users/"+target.ID+"/role", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+superJWT)
	resp, err = client.Do(req)
	if err != nil {
		t.Fatalf("superadmin role update failed: %v", err)
	}
	respBody = testutil.MustReadBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 for superadmin granting superadmin, got %d: %s", resp.StatusCode, respBody)
	}

	// Invalid role strings must be rejected regardless of caller.
	bad := map[string]string{"role": "hacker"}
	b, _ = json.Marshal(bad)
	req, _ = http.NewRequest(http.MethodPut, ts.URL+"/api/admin/users/"+target.ID+"/role", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+superJWT)
	resp, err = client.Do(req)
	if err != nil {
		t.Fatalf("bad role request failed: %v", err)
	}
	respBody = testutil.MustReadBody(resp)
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid role, got %d: %s", resp.StatusCode, respBody)
	}
}
