-- ============================================================
-- Phase 1: Mercado Pago Marketplace integration
-- ============================================================

-- Seller MP OAuth credentials
-- access_token is sensitive — store as text, protect with RLS.
-- In production: consider Supabase Vault for additional encryption.
CREATE TABLE IF NOT EXISTS seller_mp_credentials (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_user_id      TEXT        NOT NULL,
  access_token    TEXT        NOT NULL,
  refresh_token   TEXT,
  expires_at      TIMESTAMPTZ,
  scope           TEXT,
  live_mode       BOOLEAN     DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_mp_credentials_seller_unique UNIQUE (seller_id)
);

-- RLS: seller sees only their own row; service role bypasses
ALTER TABLE seller_mp_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers see own mp credentials"
  ON seller_mp_credentials FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "sellers insert own mp credentials"
  ON seller_mp_credentials FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "sellers update own mp credentials"
  ON seller_mp_credentials FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "sellers delete own mp credentials"
  ON seller_mp_credentials FOR DELETE
  USING (auth.uid() = seller_id);

-- Index for fast lookups in webhook / checkout flows (service role)
CREATE INDEX IF NOT EXISTS idx_seller_mp_credentials_seller_id
  ON seller_mp_credentials(seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_mp_credentials_mp_user_id
  ON seller_mp_credentials(mp_user_id);

-- ============================================================
-- Extend payment_events table for MP automated flow
-- ============================================================

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS mp_preference_id  TEXT,
  ADD COLUMN IF NOT EXISTS mp_checkout_url   TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_ars  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mp_payment_id     TEXT;

-- Index for webhook lookups by mp_payment_id
CREATE INDEX IF NOT EXISTS idx_payment_events_mp_payment_id
  ON payment_events(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- ============================================================
-- Add mp_user_id to profiles (denormalized for display + lookup)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mp_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mp_user_id   TEXT;

-- Function to keep profiles.mp_connected in sync with credentials table
CREATE OR REPLACE FUNCTION sync_mp_connected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles SET mp_connected = TRUE, mp_user_id = NEW.mp_user_id
    WHERE id = NEW.seller_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET mp_connected = FALSE, mp_user_id = NULL
    WHERE id = OLD.seller_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_mp_connected
  AFTER INSERT OR UPDATE OR DELETE ON seller_mp_credentials
  FOR EACH ROW EXECUTE FUNCTION sync_mp_connected();
