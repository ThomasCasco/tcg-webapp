-- =====================================================================
-- Migration v3: catalogo real, alertas, notificaciones y mystery packs
-- =====================================================================
-- Idempotente. Ejecutar DESPUES de migrate-v2.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Referencia al catalogo externo (Pokemon TCG API id) en inventario y listings
-- ---------------------------------------------------------------------
alter table if exists public.inventory_entries
  add column if not exists catalog_card_id text;

alter table if exists public.inventory_entries
  add column if not exists image_url text;

alter table if exists public.market_listings
  add column if not exists catalog_card_id text;

alter table if exists public.market_listings
  add column if not exists image_url text;

-- ---------------------------------------------------------------------
-- Mystery packs: extensiones sobre market_listings
-- ---------------------------------------------------------------------
alter table if exists public.market_listings
  add column if not exists listing_type text not null default 'single'
    check (listing_type in ('single', 'mystery_pack'));

alter table if exists public.market_listings
  add column if not exists pack_card_count integer;

alter table if exists public.market_listings
  add column if not exists pack_rarity_floor text;

alter table if exists public.market_listings
  add column if not exists pack_theme text;

alter table if exists public.market_listings
  add column if not exists pack_description text;

create index if not exists idx_market_listings_type
  on public.market_listings(listing_type);

-- ---------------------------------------------------------------------
-- Watchlist: alertas por texto (matchea card_name, set_name, pack_theme)
-- ---------------------------------------------------------------------
create table if not exists public.card_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  max_price_ars numeric(12, 2),
  created_at timestamptz not null default now(),
  unique (user_id, query)
);

create index if not exists idx_card_watches_user on public.card_watches(user_id);
create index if not exists idx_card_watches_query on public.card_watches(query);

-- ---------------------------------------------------------------------
-- Notifications: feed in-app
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('listing_match', 'transaction_update', 'dispute_update', 'system')),
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications(user_id) where read_at is null;
