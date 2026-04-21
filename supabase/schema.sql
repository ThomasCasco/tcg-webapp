create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  whatsapp text,
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_cards (
  id text primary key,
  name text not null,
  set_name text not null,
  card_number text not null,
  rarity text not null,
  market_ref_price_ars numeric(12, 2),
  created_at timestamptz not null default now(),
  unique (set_name, card_number)
);

create table if not exists public.inventory_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  card_id text not null references public.catalog_cards(id),
  condition text not null check (
    condition in ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged')
  ),
  quantity integer not null default 1 check (quantity > 0),
  asking_price_ars numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  inventory_card_id uuid not null references public.inventory_cards(id) on delete cascade,
  price_ars numeric(12, 2) not null check (price_ars > 0),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'active' check (
    status in ('active', 'pending_payment', 'sold', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  payment_status text not null default 'pending',
  delivery_status text not null default 'pending',
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  transaction_event_id uuid references public.transaction_events(id) on delete set null,
  event_type text not null check (
    event_type in ('sale_completed', 'buyer_report', 'manual_review', 'rating_submitted')
  ),
  score_delta integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_owner on public.inventory_cards(owner_id);
create index if not exists idx_listings_seller_status on public.listings(seller_id, status);
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_transaction_events_listing on public.transaction_events(listing_id);
create index if not exists idx_reputation_events_seller on public.reputation_events(seller_id);

alter table public.profiles enable row level security;
alter table public.inventory_cards enable row level security;
alter table public.listings enable row level security;
alter table public.transaction_events enable row level security;
alter table public.reputation_events enable row level security;

create policy "profiles_select_self_or_public" on public.profiles
  for select using (auth.uid() = id or account_status = 'active');

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

create policy "inventory_owner_all" on public.inventory_cards
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "listings_public_read" on public.listings
  for select using (status = 'active' or auth.uid() = seller_id);

create policy "listings_owner_write" on public.listings
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

create policy "tx_parties_read" on public.transaction_events
  for select using (auth.uid() = buyer_id or auth.uid() in (
    select seller_id from public.listings where public.listings.id = listing_id
  ));

create policy "tx_buyer_create" on public.transaction_events
  for insert with check (auth.uid() = buyer_id);

create policy "reputation_read_all" on public.reputation_events
  for select using (true);
