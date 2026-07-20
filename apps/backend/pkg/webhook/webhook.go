package webhook

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"math/big"
	"net"
	"net/http"
	"net/url"
	"time"
)

// Event represents a webhook event.
type Event struct {
	Type      string                 `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	Payload   map[string]interface{} `json:"payload"`
}

// Delivery represents a webhook delivery attempt.
type Delivery struct {
	ID       string    `json:"id"`
	URL      string    `json:"url"`
	Event    Event     `json:"event"`
	Status   int       `json:"status"`
	Error    string    `json:"error,omitempty"`
	Attempts int       `json:"attempts"`
	SentAt   time.Time `json:"sent_at"`
}

// Config holds webhook configuration.
type Config struct {
	URL      string            `json:"url"`
	Secret   string            `json:"secret"`
	Events   []string          `json:"events"`
	Headers  map[string]string `json:"headers,omitempty"`
	RetryMax int               `json:"retry_max"`
	Timeout  time.Duration     `json:"timeout"`
}

// Dispatcher sends webhook events.
type Dispatcher struct {
	client *http.Client
}

// NewDispatcher creates a new webhook dispatcher.
func NewDispatcher() *Dispatcher {
	return &Dispatcher{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Send delivers a webhook event.
func (d *Dispatcher) Send(ctx context.Context, cfg Config, event Event) (*Delivery, error) {
	return d.SendWithIdempotency(ctx, cfg, event, "")
}

// SendWithIdempotency delivers a webhook event with an idempotency key.
func (d *Dispatcher) SendWithIdempotency(ctx context.Context, cfg Config, event Event, idempotencyKey string) (*Delivery, error) {
	if !isEventAllowed(event.Type, cfg.Events) {
		return nil, fmt.Errorf("event type %s not subscribed", event.Type)
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return nil, fmt.Errorf("marshal event: %w", err)
	}

	delivery := &Delivery{
		ID:     generateID(),
		URL:    cfg.URL,
		Event:  event,
		SentAt: time.Now(),
	}

	if err := ValidateWebhookURL(cfg.URL); err != nil {
		delivery.Error = err.Error()
		return delivery, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.URL, bytes.NewReader(payload))
	if err != nil {
		delivery.Error = err.Error()
		return delivery, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-ID", delivery.ID)
	req.Header.Set("X-Event-Type", event.Type)
	req.Header.Set("X-Webhook-Timestamp", fmt.Sprintf("%d", event.Timestamp.Unix()))
	if idempotencyKey != "" {
		req.Header.Set("X-Idempotency-Key", idempotencyKey)
	}

	if cfg.Secret != "" {
		sig := signPayload(payload, cfg.Secret)
		req.Header.Set("X-Webhook-Signature", "sha256="+sig)
	}

	for k, v := range cfg.Headers {
		req.Header.Set(k, v)
	}

	pinnedClient, err := newPinnedHTTPClient(cfg.URL)
	if err != nil {
		delivery.Error = err.Error()
		return delivery, err
	}
	resp, err := pinnedClient.Do(req)
	if err != nil {
		delivery.Error = err.Error()
		return delivery, err
	}
	defer resp.Body.Close()

	delivery.Status = resp.StatusCode
	if resp.StatusCode >= 400 {
		delivery.Error = fmt.Sprintf("HTTP %d", resp.StatusCode)
		return delivery, fmt.Errorf("webhook delivery failed: HTTP %d", resp.StatusCode)
	}

	return delivery, nil
}

// SendWithRetry sends a webhook with exponential backoff retries.
func (d *Dispatcher) SendWithRetry(ctx context.Context, cfg Config, event Event) (*Delivery, error) {
	maxRetries := cfg.RetryMax
	if maxRetries <= 0 {
		maxRetries = 3
	}

	var lastDelivery *Delivery
	var lastErr error

	for i := 0; i <= maxRetries; i++ {
		if i > 0 {
			backoff := exponentialBackoff(i)
			time.Sleep(backoff)
		}

		delivery, err := d.Send(ctx, cfg, event)
		lastDelivery = delivery
		if err == nil {
			delivery.Attempts = i + 1
			return delivery, nil
		}
		lastErr = err

		if delivery != nil && delivery.Status >= 400 && delivery.Status < 500 {
			break
		}
	}

	if lastDelivery != nil {
		lastDelivery.Attempts = maxRetries + 1
	}
	return lastDelivery, fmt.Errorf("webhook failed after %d retries: %w", maxRetries, lastErr)
}

func exponentialBackoff(attempt int) time.Duration {
	base := math.Pow(2, float64(attempt))
	n, _ := rand.Int(rand.Reader, big.NewInt(1<<53))
	jitter := (float64(n.Int64()) / float64(1<<53)) * 0.5 * base
	duration := time.Duration((base + jitter) * float64(time.Second))
	if duration > 60*time.Second {
		duration = 60 * time.Second
	}
	return duration
}

func signPayload(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

// IsEventAllowed reports whether an event type is subscribed to by the given
// allow-list. Exported so the webhook service can pre-filter before dispatch.
func IsEventAllowed(eventType string, allowed []string) bool {
	return isEventAllowed(eventType, allowed)
}

func isEventAllowed(eventType string, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}
	for _, a := range allowed {
		if a == eventType || a == "*" {
			return true
		}
	}
	return false
}

// newPinnedHTTPClient validates the URL's resolved IPs and returns an HTTP
// client that dials the first validated IP directly, preventing DNS rebinding.
// The Host header and TLS SNI remain the original hostname so HTTPS works.
func newPinnedHTTPClient(rawURL string) (*http.Client, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL")
	}
	host := u.Hostname()
	if host == "" {
		return nil, fmt.Errorf("missing hostname")
	}

	// Test-only bypass for httptest servers on loopback addresses.
	if skipWebhookSSRFCheck {
		return &http.Client{
			Timeout:       30 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error { return http.ErrUseLastResponse },
		}, nil
	}

	ips, err := net.LookupIP(host)
	if err != nil {
		return nil, fmt.Errorf("cannot resolve hostname: %w", err)
	}
	if len(ips) == 0 {
		return nil, fmt.Errorf("no IPs resolved for hostname")
	}
	for _, ip := range ips {
		if ip.IsUnspecified() || ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
			return nil, fmt.Errorf("URL resolves to private/reserved IP %s", ip)
		}
	}
	dialIP := ips[0]
	port := u.Port()
	if port == "" {
		if u.Scheme == "https" {
			port = "443"
		} else {
			port = "80"
		}
	}
	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			dialAddr := net.JoinHostPort(dialIP.String(), port)
			d := net.Dialer{Timeout: 10 * time.Second}
			return d.DialContext(ctx, network, dialAddr)
		},
	}
	if u.Scheme == "https" {
		transport.TLSClientConfig = &tls.Config{ServerName: host}
	}
	return &http.Client{
		Timeout:       30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error { return http.ErrUseLastResponse },
		Transport:     transport,
	}, nil
}

func generateID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return fmt.Sprintf("wh_%x", b)
}

// skipWebhookSSRFCheck is a test-only flag to bypass SSRF validation.
var skipWebhookSSRFCheck bool

// SetSkipWebhookSSRFCheck sets the SSRF check bypass flag (for testing only).
func SetSkipWebhookSSRFCheck(skip bool) {
	skipWebhookSSRFCheck = skip
}

// ValidateWebhookURL checks that a webhook URL does not point to a private/reserved IP to prevent SSRF.
func ValidateWebhookURL(rawURL string) error {
	if skipWebhookSSRFCheck {
		return nil
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("invalid webhook URL")
	}
	host := u.Hostname()
	if host == "" {
		return fmt.Errorf("webhook URL missing hostname")
	}
	ips, err := net.LookupIP(host)
	if err != nil {
		return fmt.Errorf("cannot resolve webhook URL hostname: %w", err)
	}
	for _, ip := range ips {
		if ip.IsUnspecified() || ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
			return fmt.Errorf("webhook URL resolves to private/reserved IP %s", ip)
		}
	}
	return nil
}
