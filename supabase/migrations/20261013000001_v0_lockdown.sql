-- ============================================================
-- v0 lockdown: no direct table access with the public (anon) key
-- ============================================================
--
-- The app reads and writes Postgres only through the service-role client in
-- lib/server/ (it bypasses RLS). Nothing in the browser queries tables with the
-- anon key, so every public table gets RLS on and no policies at all. That
-- closes, among others:
--   * public reads of profiles (whatsapp, payment alias, mp_user_id)
--   * users editing their own profiles.mp_connected / account_status
--   * users inserting fake seller_mp_credentials rows (the trigger would flip
--     profiles.mp_connected and show a fake "Mercado Pago" badge)
--   * direct inserts into auction_bids / claim_session_cards that skip the
--     app's validation
--
-- Idempotent. Run it last, after schema.sql, every migrate-v*.sql and the
-- other files in this folder: it drops policies created by earlier files.
-- Storage policies (public read of the card-images bucket) are untouched.

-- Column the app already writes (inventory front/back photos). Missing in
-- production because 20260516000001_back_image_url.sql was never applied.
alter table if exists public.inventory_entries
  add column if not exists back_image_url text;

do $$
declare
  t record;
  p record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;

  for p in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
