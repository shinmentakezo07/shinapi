package provider

import (
	"context"
	"fmt"
	"testing"

	"dra-platform/backend/pkg/llm"
)

// fakeProvider returns errors for the first `failN` calls then succeeds.
type fakeProvider struct {
	name    string
	failN   int
	calls   int
	streams bool
}

func (f *fakeProvider) Name() string { return f.name }
func (f *fakeProvider) SupportsThinking() bool {
	return false
}
func (f *fakeProvider) Chat(ctx context.Context, req *llm.ChatRequest) (*llm.ChatResponse, error) {
	f.calls++
	if f.calls <= f.failN {
		return nil, fmt.Errorf("provider %s failing (call %d)", f.name, f.calls)
	}
	return &llm.ChatResponse{
		ID:      "ok",
		Object:  "chat.completion",
		Model:   req.Model,
		Choices: []llm.Choice{{Index: 0, Message: llm.Message{Role: llm.RoleAssistant, Content: "ok"}}},
	}, nil
}
func (f *fakeProvider) ChatStream(ctx context.Context, req *llm.ChatRequest) (<-chan llm.StreamChunk, error) {
	f.calls++
	if f.calls <= f.failN {
		return nil, fmt.Errorf("provider %s failing (call %d)", f.name, f.calls)
	}
	ch := make(chan llm.StreamChunk, 1)
	ch <- llm.StreamChunk{FinishReason: ptrFinish(llm.FinishReasonStop), Delta: llm.Message{Content: "ok"}}
	close(ch)
	return ch, nil
}
func (f *fakeProvider) ListModels(ctx context.Context) ([]llm.ModelInfo, error) {
	return nil, nil
}

func ptrFinish(f llm.FinishReason) *llm.FinishReason { return &f }

// TestMultiKeyProvider_FailoverOnChat verifies that when the first selected key
// fails, the request is retried on the next healthy instance instead of erroring.
func TestMultiKeyProvider_FailoverOnChat(t *testing.T) {
	bad := &fakeProvider{name: "bad", failN: 10}
	good := &fakeProvider{name: "good", failN: 0}
	mkp := NewMultiKeyProvider("test", []KeyInstance{
		{APIKey: "k1", Provider: bad, Weight: 1},
		{APIKey: "k2", Provider: good, Weight: 1},
	})

	req := &llm.ChatRequest{Model: "gpt-4o", Messages: []llm.Message{{Role: llm.RoleUser, Content: "hi"}}}
	resp, err := mkp.Chat(context.Background(), req)
	if err != nil {
		t.Fatalf("Chat() should fail over to healthy key, got error: %v", err)
	}
	if resp == nil {
		t.Fatal("Chat() returned nil response after failover")
	}
	if bad.calls == 0 {
		t.Error("expected the failing provider to have been attempted")
	}
	if good.calls == 0 {
		t.Error("expected the healthy provider to have been used as failover")
	}
}

// TestMultiKeyProvider_FailoverOnStream verifies streaming failover.
func TestMultiKeyProvider_FailoverOnStream(t *testing.T) {
	bad := &fakeProvider{name: "bad", failN: 10, streams: true}
	good := &fakeProvider{name: "good", failN: 0, streams: true}
	mkp := NewMultiKeyProvider("test", []KeyInstance{
		{APIKey: "k1", Provider: bad, Weight: 1},
		{APIKey: "k2", Provider: good, Weight: 1},
	})

	req := &llm.ChatRequest{Model: "gpt-4o", Messages: []llm.Message{{Role: llm.RoleUser, Content: "hi"}}}
	ch, err := mkp.ChatStream(context.Background(), req)
	if err != nil {
		t.Fatalf("ChatStream() should fail over, got error: %v", err)
	}
	var got int
	for range ch {
		got++
	}
	if got == 0 {
		t.Error("ChatStream() produced no chunks after failover")
	}
}

// TestMultiKeyProvider_AllFail verifies that if every key fails, the error is surfaced.
func TestMultiKeyProvider_AllFail(t *testing.T) {
	bad1 := &fakeProvider{name: "bad1", failN: 100}
	bad2 := &fakeProvider{name: "bad2", failN: 100}
	mkp := NewMultiKeyProvider("test", []KeyInstance{
		{APIKey: "k1", Provider: bad1, Weight: 1},
		{APIKey: "k2", Provider: bad2, Weight: 1},
	})

	req := &llm.ChatRequest{Model: "gpt-4o", Messages: []llm.Message{{Role: llm.RoleUser, Content: "hi"}}}
	_, err := mkp.Chat(context.Background(), req)
	if err == nil {
		t.Fatal("Chat() with all-failing keys should return an error")
	}
}
