-- Subastas: listings con pujas, ganador y cierre manual/por tiempo.

create table if not exists public.auction_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id) on delete set null,
  seller_handle text not null,
  inventory_entry_id uuid references public.inventory_entries(id) on delete set null,
  card_name text not null,
  set_name text,
  catalog_card_id text,
  image_url text,
  condition text not null check (
    condition in ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged')
  ),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled', 'settled')),
  start_price_ars numeric(12, 2) not null check (start_price_ars > 0),
  bid_increment_ars numeric(12, 2) not null default 500 check (bid_increment_ars > 0),
  current_price_ars numeric(12, 2) not null check (current_price_ars > 0),
  buyout_price_ars numeric(12, 2),
  bid_count integer not null default 0 check (bid_count >= 0),
  winner_id uuid references auth.users(id) on delete set null,
  winner_handle text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  offers_shipping boolean not null default false,
  offers_pickup boolean not null default true,
  delivery_area_notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (buyout_price_ars is null or buyout_price_ars > start_price_ars)
);

create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auction_listings(id) on delete cascade,
  bidder_id uuid not null references auth.users(id) on delete cascade,
  bidder_handle text not null,
  amount_ars numeric(12, 2) not null check (amount_ars > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_auction_listings_status_ends on public.auction_listings(status, ends_at);
create index if not exists idx_auction_listings_seller on public.auction_listings(seller_id, created_at desc);
create index if not exists idx_auction_bids_auction_amount on public.auction_bids(auction_id, amount_ars desc);
create index if not exists idx_auction_bids_bidder on public.auction_bids(bidder_id, created_at desc);

alter table if exists public.auction_listings enable row level security;
alter table if exists public.auction_bids enable row level security;

create policy "auction_listings_public_read" on public.auction_listings
  for select using (status in ('active', 'ended', 'settled') or auth.uid() = seller_id);

create policy "auction_listings_seller_write" on public.auction_listings
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

create policy "auction_bids_public_read" on public.auction_bids
  for select using (true);

create policy "auction_bids_bidder_create" on public.auction_bids
  for insert with check (auth.uid() = bidder_id);
