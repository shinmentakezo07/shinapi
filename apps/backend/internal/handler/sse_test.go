package handler

import (
	"encoding/json"
	"sync"
	"testing"
	"time"
)

func newTestHub() *NotificationHub {
	return NewNotificationHub()
}

// TestNotificationHub_DeliversUnderBurst verifies that notifications are not
// silently dropped when the internal broadcast buffer is full. Before the fix,
// SendToUsers/Send/Broadcast used a non-blocking select that dropped events
// whenever broadcastCh (100-buffered) was full — so a burst of webhook/credit
// events could lose a targeted user's new_message even though the message was
// persisted. enqueue() now blocks (cooperatively) until the consumer drains.
//
// The test mimics a real SSE client: a background goroutine drains the
// per-client channel continuously (exactly what NotificationsStream does over
// the wire), while the main goroutine fires a burst far exceeding the 100-size
// broadcast buffer. Every event must be delivered.
func TestNotificationHub_DeliversUnderBurst(t *testing.T) {
	hub := newTestHub()
	userID := "u-burst"
	ch := hub.Subscribe(userID)
	if ch == nil {
		t.Fatal("subscribe returned nil")
	}
	defer hub.Unsubscribe(userID, ch)

	const burst = 500

	// Continuous drain, like a live SSE reader.
	var got int
	var mu sync.Mutex
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			ev, ok := <-ch
			if !ok {
				return
			}
			if ev.Type != "new_message" {
				t.Errorf("unexpected event type: %s", ev.Type)
				return
			}
			mu.Lock()
			got++
			mu.Unlock()
			if got >= burst {
				return
			}
		}
	}()

	for i := 0; i < burst; i++ {
		hub.SendToUsers([]string{userID}, "new_message", map[string]int{"i": i})
	}

	select {
	case <-done:
	case <-time.After(15 * time.Second):
		mu.Lock()
		defer mu.Unlock()
		t.Fatalf("delivered %d/%d events — notifications were dropped under burst", got, burst)
	}

	mu.Lock()
	defer mu.Unlock()
	if got != burst {
		t.Fatalf("delivered %d/%d events — %d notifications were dropped under burst", got, burst, burst-got)
	}
}

// TestNotificationHub_SendToUsersBasic ensures a single targeted event is delivered.
func TestNotificationHub_SendToUsersBasic(t *testing.T) {
	hub := newTestHub()
	userID := "u-1"
	ch := hub.Subscribe(userID)
	if ch == nil {
		t.Fatal("subscribe returned nil")
	}
	defer hub.Unsubscribe(userID, ch)

	hub.SendToUsers([]string{userID}, "new_message", map[string]string{"hello": "world"})

	select {
	case ev := <-ch:
		var payload map[string]string
		if err := json.Unmarshal(ev.Payload, &payload); err != nil {
			t.Fatalf("unmarshal payload: %v", err)
		}
		if payload["hello"] != "world" {
			t.Errorf("payload = %v", payload)
		}
	case <-time.After(1 * time.Second):
		t.Fatal("timed out waiting for event")
	}
}
