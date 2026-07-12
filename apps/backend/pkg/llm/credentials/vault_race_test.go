package credentials

import (
	"sync"
	"testing"
)

// TestVault_ConcurrentAccessRace verifies that concurrent GetBestKey (which
// reads cached Credential fields) and RecordSuccess/RecordFailure (which mutate
// them) do not race. Run with -race to detect data races.
func TestVault_ConcurrentAccessRace(t *testing.T) {
	v, err := NewVault(newMemoryStore(), "test-encryption-key-0123456789")
	if err != nil {
		t.Fatalf("NewVault: %v", err)
	}

	// Add two credentials so GetBestKey has a non-empty cache.
	if _, err := v.Add("openai-1", "openai", "sk-test-1", "https://api.openai.com", 10); err != nil {
		t.Fatalf("Add: %v", err)
	}
	if _, err := v.Add("openai-2", "openai", "sk-test-2", "https://api.openai.com", 5); err != nil {
		t.Fatalf("Add: %v", err)
	}

	// Populate cache.
	if _, _, err := v.GetBestKey("openai"); err != nil {
		t.Fatalf("GetBestKey warmup: %v", err)
	}

	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			for j := 0; j < 50; j++ {
				_, cred, _ := v.GetBestKey("openai")
				if cred != nil {
					if j%2 == 0 {
						v.RecordSuccess(cred.ID)
					} else {
						v.RecordFailure(cred.ID, errFake)
					}
				}
			}
		}(i)
	}
	wg.Wait()
}

type fakeErr string

func (e fakeErr) Error() string { return string(e) }

var errFake = fakeErr("transient")
