-- ---------------------------------------------------------------------
-- Trades: public inventory offers + public wanted cards
-- ---------------------------------------------------------------------

alter table if exists public.inventory_entries
  add column if not exists available_for_trade boolean not null default false;

alter table if exists public.inventory_entries
  add column if not exists trade_notes text;

alter table if exists public.card_watches
  add column if not exists public_wanted boolean not null default true;

alter table if exists public.card_watches
  add column if not exists notes text;

create index if not exists idx_inventory_entries_trade
  on public.inventory_entries(owner_id, created_at desc)
  where available_for_trade = true;

create index if not exists idx_card_watches_public
  on public.card_watches(user_id, created_at desc)
  where public_wanted = true;
