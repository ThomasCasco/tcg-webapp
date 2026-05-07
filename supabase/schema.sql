create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  location text,
  avatar_url text,
  favorite_game text,
  favorite_card text,
  instagram text,
  discord text,
  whatsapp text,
  payment_provider text not null default 'mercado_pago' check (
    payment_provider in ('mercado_pago', 'bank_transfer', 'cash', 'other')
  ),
  payment_alias text,
  payment_instructions text,
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

create table if not exists public.profile_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.trade_proposals (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references auth.users(id) on delete cascade,
  proposer_handle text not null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_handle text not null,
  offered_inventory_ids uuid[] not null default '{}'::uuid[],
  requested_inventory_ids uuid[] not null default '{}'::uuid[],
  message text,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'completed', 'declined', 'cancelled')
  ),
  proposer_confirmed_at timestamptz,
  recipient_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposer_id <> recipient_id)
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
alter table if exists public.profile_follows enable row level security;
alter table if exists public.trade_proposals enable row level security;

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

create policy "profile_follows_read_all" on public.profile_follows
  for select using (true);

create policy "profile_follows_owner_write" on public.profile_follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create policy "trade_proposals_parties_read" on public.trade_proposals
  for select using (auth.uid() = proposer_id or auth.uid() = recipient_id);

create policy "trade_proposals_proposer_create" on public.trade_proposals
  for insert with check (auth.uid() = proposer_id);

create policy "trade_proposals_parties_update" on public.trade_proposals
  for update using (auth.uid() = proposer_id or auth.uid() = recipient_id)
  with check (auth.uid() = proposer_id or auth.uid() = recipient_id);

-- -----------------------------------------------------------------
-- Public beta tables used by Next.js route handlers (no auth lock-in)
-- -----------------------------------------------------------------

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
  available_for_trade boolean not null default false,
  trade_notes text,
  created_at timestamptz not null default now()
);

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

alter table if exists public.inventory_entries
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table if exists public.inventory_entries
  add column if not exists available_for_trade boolean not null default false;

alter table if exists public.inventory_entries
  add column if not exists trade_notes text;

alter table if exists public.card_watches
  add column if not exists public_wanted boolean not null default true;

alter table if exists public.card_watches
  add column if not exists notes text;

alter table if exists public.trade_proposals
  add column if not exists proposer_confirmed_at timestamptz;

alter table if exists public.trade_proposals
  add column if not exists recipient_confirmed_at timestamptz;

alter table if exists public.profiles
  add column if not exists payment_provider text not null default 'mercado_pago' check (
    payment_provider in ('mercado_pago', 'bank_transfer', 'cash', 'other')
  );

alter table if exists public.profiles
  add column if not exists payment_alias text;

alter table if exists public.profiles
  add column if not exists payment_instructions text;

alter table if exists public.profiles
  add column if not exists display_name text;

alter table if exists public.profiles
  add column if not exists bio text;

alter table if exists public.profiles
  add column if not exists location text;

alter table if exists public.profiles
  add column if not exists avatar_url text;

alter table if exists public.profiles
  add column if not exists favorite_game text;

alter table if exists public.profiles
  add column if not exists favorite_card text;

alter table if exists public.profiles
  add column if not exists instagram text;

alter table if exists public.profiles
  add column if not exists discord text;

alter table if exists public.market_listings
  add column if not exists seller_id uuid references auth.users(id) on delete set null;

alter table if exists public.payment_events
  add column if not exists buyer_id uuid references auth.users(id) on delete set null;

alter table if exists public.payment_events
  add column if not exists fulfillment_status text not null default 'pending' check (
    fulfillment_status in ('pending', 'seller_confirmed', 'shipped', 'delivered', 'disputed', 'closed')
  );

alter table if exists public.payment_events
  add column if not exists shipping_tracking text;

create index if not exists idx_inventory_entries_seller on public.inventory_entries(seller_handle);
create index if not exists idx_inventory_entries_owner on public.inventory_entries(owner_id);
create index if not exists idx_inventory_entries_trade on public.inventory_entries(owner_id, created_at desc) where available_for_trade = true;
create index if not exists idx_profiles_username_search on public.profiles(username);
create index if not exists idx_profiles_updated on public.profiles(updated_at desc);
create index if not exists idx_profile_follows_following on public.profile_follows(following_id, created_at desc);
create index if not exists idx_profile_follows_follower on public.profile_follows(follower_id, created_at desc);
create index if not exists idx_trade_proposals_proposer on public.trade_proposals(proposer_id, created_at desc);
create index if not exists idx_trade_proposals_recipient on public.trade_proposals(recipient_id, created_at desc);
create index if not exists idx_trade_proposals_status on public.trade_proposals(status);
create index if not exists idx_market_listings_status on public.market_listings(status);
create index if not exists idx_market_listings_seller on public.market_listings(seller_handle);
create index if not exists idx_market_listings_seller_id on public.market_listings(seller_id);
create index if not exists idx_payment_events_transaction on public.payment_events(transaction_id);
create index if not exists idx_payment_events_buyer on public.payment_events(buyer_id);
create index if not exists idx_dispute_events_transaction on public.dispute_events(transaction_id);
