-- ============================================================
-- Phase 2: persistent audit trail for MP webhook calls
-- ============================================================
--
-- Why: webhook failures used to vanish into stdout logs. Now every POST to
-- /api/webhooks/mercadopago is recorded here with raw payload, signature
-- headers, and processing outcome. Reconciliation jobs and humans can query
-- this table to figure out exactly why a transaction is stuck.

CREATE TABLE IF NOT EXISTS mp_webhook_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- MP payment id (data.id from the webhook body), nullable when payload was malformed
  mp_payment_id     TEXT,
  -- our transaction_id (= MP external_reference), nullable until we resolve it
  transaction_id    TEXT,
  -- raw request bits for forensic replay
  raw_body          TEXT        NOT NULL,
  x_signature       TEXT,
  x_request_id      TEXT,
  -- outcome of processing this event
  outcome           TEXT        NOT NULL,
    -- one of: 'verified' | 'still_pending' | 'blocked' | 'not_found'
    --        | 'invalid_signature' | 'invalid_json' | 'ignored' | 'fetch_failed'
  outcome_reason    TEXT,
  CONSTRAINT mp_webhook_events_outcome_check CHECK (outcome IN (
    'verified', 'still_pending', 'blocked', 'not_found',
    'invalid_signature', 'invalid_json', 'ignored', 'fetch_failed'
  ))
);

CREATE INDEX IF NOT EXISTS mp_webhook_events_transaction_idx
  ON mp_webhook_events (transaction_id);
CREATE INDEX IF NOT EXISTS mp_webhook_events_payment_idx
  ON mp_webhook_events (mp_payment_id);
CREATE INDEX IF NOT EXISTS mp_webhook_events_received_idx
  ON mp_webhook_events (received_at DESC);

-- RLS: only service role reads/writes. No end-user access.
ALTER TABLE mp_webhook_events ENABLE ROW LEVEL SECURITY;
-- (No policies created → table is invisible to anon/authenticated roles.)
