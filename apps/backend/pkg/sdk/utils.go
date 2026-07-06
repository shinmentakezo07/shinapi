package sdk

import (
	"encoding/json"
	"io"
	"strings"
)

type envelope struct {
	Success   bool            `json:"success"`
	Data      json.RawMessage `json:"data,omitempty"`
	Error     string          `json:"error,omitempty"`
	Meta      *PaginatedMeta  `json:"meta,omitempty"`
	RequestID string          `json:"requestId,omitempty"`
}

type PaginatedMeta struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"totalPages"`
}

func unmarshalData(raw json.RawMessage, v interface{}) error {
	if len(raw) == 0 {
		return nil
	}
	return json.Unmarshal(raw, v)
}

func paginatedResult[T any](e *envelope) (*PaginatedResult[T], error) {
	var items []T
	if err := unmarshalData(e.Data, &items); err != nil {
		return nil, err
	}
	pr := &PaginatedResult[T]{
		Data:  items,
		Page:  1,
		Limit: 20,
	}
	if e.Meta != nil {
		pr.Total = e.Meta.Total
		pr.Page = e.Meta.Page
		pr.Limit = e.Meta.Limit
		pr.TotalPages = e.Meta.TotalPages
	}
	return pr, nil
}

// SSEEvent represents a single server-sent event as defined by the SSE specification.
type SSEEvent struct {
	EventType string // from "event:" lines; defaults to "message" per SSE spec
	Data      string // from "data:" lines, joined with newlines if multiple
	ID        string // from "id:" lines
}

// ReadSSE reads server-sent events from a reader per the SSE specification.
// It accumulates event:, data:, and id: fields across lines, and emits a complete
// SSEEvent when a blank line (event boundary) is encountered. Multiple data: lines
// for the same event are joined with newlines, as required by the spec.
func ReadSSE(r io.Reader, yield func(SSEEvent) bool) {
	buf := make([]byte, 4096)
	var line []byte
	var eventType string
	var dataLines []string
	var eventID string

	// sseFieldValue extracts the value from an SSE field line.
	// Per the SSE spec, after "field:", a single leading space is stripped if present.
	sseFieldValue := func(line, prefix string) string {
		v := strings.TrimPrefix(line, prefix)
		if len(v) > 0 && v[0] == ' ' {
			v = v[1:]
		}
		return v
	}

	emit := func() bool {
		if len(dataLines) == 0 && eventType == "" && eventID == "" {
			return true
		}
		evt := SSEEvent{
			EventType: eventType,
			Data:      strings.Join(dataLines, "\n"),
			ID:        eventID,
		}
		if evt.EventType == "" {
			evt.EventType = "message"
		}
		return yield(evt)
	}

	reset := func() {
		eventType = ""
		dataLines = dataLines[:0]
		eventID = ""
	}

	for {
		n, err := r.Read(buf)
		if n > 0 {
			for i := 0; i < n; i++ {
				b := buf[i]
				if b == '\n' {
					if len(line) > 0 {
						s := string(line)
						if strings.HasPrefix(s, "data:") {
							dataLines = append(dataLines, sseFieldValue(s, "data:"))
						} else if strings.HasPrefix(s, "event:") {
							eventType = sseFieldValue(s, "event:")
						} else if strings.HasPrefix(s, "id:") {
							eventID = sseFieldValue(s, "id:")
						}
					}
					// Blank line = event boundary
					if len(line) == 0 {
						if !emit() {
							return
						}
						reset()
					}
					line = line[:0]
				} else if b != '\r' {
					line = append(line, b)
				}
			}
		}
		if err != nil {
			// Emit any remaining event data
			if len(line) > 0 {
				s := string(line)
				if strings.HasPrefix(s, "data:") {
					dataLines = append(dataLines, sseFieldValue(s, "data:"))
				} else if strings.HasPrefix(s, "event:") {
					eventType = sseFieldValue(s, "event:")
				} else if strings.HasPrefix(s, "id:") {
					eventID = sseFieldValue(s, "id:")
				}
			}
			emit()
			return
		}
	}
}
