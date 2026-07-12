-- Add a UNIQUE constraint on stripe_invoices.stripe_invoice_id so that
-- replayed or raced checkout.session.completed events cannot grant credits
-- twice. The existence check in service.StripeService.FulfillCheckout now
-- runs inside the same WithTx transaction; this constraint is the
-- database-level backstop for idempotency.

ALTER TABLE stripe_invoices ADD CONSTRAINT uq_stripe_invoice_id UNIQUE (stripe_invoice_id);
