-- =====================================================================
-- Migration v2: columnas de ownership y tablas post-venta
-- =====================================================================
-- Pega este bloque completo en Supabase SQL Editor.
-- Es idempotente: podes correrlo varias veces sin romper nada.
-- Si es un proyecto nuevo, conviene correr primero supabase/schema.sql.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles (mapea auth.users -> username publico)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  whatsapp text,
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- inventory_entries + ownership
-- ---------------------------------------------------------------------
create table if not exists public.inventory_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  seller_handle text not null,
  card_name text not null,
  set_name text,
  condition text not null check (
    condition in ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged')
  ),
  quantity integer not null check (quantity > 0),
  asking_price_ars numeric(12, 2),
  created_at timestamptz not null default now()
);

alter table if exists public.inventory_entries
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------
-- market_listings + ownership
-- ---------------------------------------------------------------------
create table if not exists public.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id) on delete set null,
  seller_handle text not null,
  inventory_entry_id uuid references public.inventory_entries(id) on delete set null,
  card_name text not null,
  set_name text not null,
  condition text not null check (
    condition in ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged')
  ),
  price_ars numeric(12, 2) not null check (price_ars > 0),
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (
    status in ('active', 'pending_payment', 'sold', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

alter table if exists public.market_listings
  add column if not exists seller_id uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------
-- payment_events (transacciones + fulfillment)
-- ---------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  buyer_handle text not null,
  provider text not null check (provider in ('mercado_pago', 'stripe', 'external_link')),
  provider_payment_id text,
  provider_status text not null default 'pending',
  verification_status text not null default 'pending_review' check (
    verification_status in ('verified', 'pending_review')
  ),
  fulfillment_status text not null default 'pending' check (
    fulfillment_status in ('pending', 'seller_confirmed', 'shipped', 'delivered', 'disputed', 'closed')
  ),
  shipping_tracking text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table if exists public.payment_events
  add column if not exists buyer_id uuid references auth.users(id) on delete set null;

alter table if exists public.payment_events
  add column if not exists fulfillment_status text not null default 'pending' check (
    fulfillment_status in ('pending', 'seller_confirmed', 'shipped', 'delivered', 'disputed', 'closed')
  );

alter table if exists public.payment_events
  add column if not exists shipping_tracking text;

-- ---------------------------------------------------------------------
-- dispute_events
-- ---------------------------------------------------------------------
create table if not exists public.dispute_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null references public.payment_events(transaction_id) on delete cascade,
  opened_by_id uuid references auth.users(id) on delete set null,
  opened_by_handle text not null,
  reason text not null,
  details text not null,
  status text not null default 'open' check (
    status in ('open', 'investigating', 'resolved', 'rejected')
  ),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------------------------
-- Indices utiles
-- ---------------------------------------------------------------------
create index if not exists idx_inventory_entries_owner on public.inventory_entries(owner_id);
create index if not exists idx_inventory_entries_seller on public.inventory_entries(seller_handle);
create index if not exists idx_market_listings_status on public.market_listings(status);
create index if not exists idx_market_listings_seller on public.market_listings(seller_handle);
create index if not exists idx_market_listings_seller_id on public.market_listings(seller_id);
create index if not exists idx_payment_events_transaction on public.payment_events(transaction_id);
create index if not exists idx_payment_events_buyer on public.payment_events(buyer_id);
create index if not exists idx_dispute_events_transaction on public.dispute_events(transaction_id);
