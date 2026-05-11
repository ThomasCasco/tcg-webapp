-- migrate-v14.sql
-- 1. Claim sessions: seller reveals cards one-by-one, buyers claim them
-- 2. Auction post-close: payment_events can now reference an auction

-- ─── CLAIM SESSIONS ────────────────────────────────────────────────────────

create table if not exists public.claim_sessions (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references auth.users(id) on delete cascade,
  seller_handle text not null,
  title        text not null,
  description  text,
  status       text not null default 'draft'
               check (status in ('draft', 'active', 'ended')),
  created_at   timestamptz not null default now(),
  ended_at     timestamptz
);

create table if not exists public.claim_session_cards (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.claim_sessions(id) on delete cascade,
  inventory_entry_id  uuid references public.inventory_entries(id) on delete set null,
  card_name           text not null,
  set_name            text,
  image_url           text,
  condition           text not null default 'near_mint',
  price_ars           integer not null default 0,
  order_index         integer not null,
  status              text not null default 'pending'
                      check (status in ('pending', 'available', 'claimed', 'skipped')),
  claimed_by_user_id  uuid references auth.users(id) on delete set null,
  claimed_by_handle   text,
  claimed_at          timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_claim_sessions_seller  on public.claim_sessions(seller_id);
create index if not exists idx_claim_sessions_status  on public.claim_sessions(status);
create index if not exists idx_claim_cards_session    on public.claim_session_cards(session_id, order_index);

alter table public.claim_sessions  enable row level security;
alter table public.claim_session_cards enable row level security;

-- Sessions: anyone can see active/ended; seller can manage their own
create policy "Public read active/ended claim sessions"
  on public.claim_sessions for select
  using (status in ('active', 'ended') or auth.uid() = seller_id);

create policy "Seller insert own sessions"
  on public.claim_sessions for insert
  with check (auth.uid() = seller_id);

create policy "Seller update own sessions"
  on public.claim_sessions for update
  using (auth.uid() = seller_id);

-- Cards: anyone can see cards; only the session owner can manage
create policy "Public read claim cards"
  on public.claim_session_cards for select
  using (true);

create policy "Seller manage cards in own session"
  on public.claim_session_cards for all
  using (
    exists (
      select 1 from public.claim_sessions
      where id = session_id and seller_id = auth.uid()
    )
  );

-- Allow buyers to update claim status on available cards
create policy "Buyer can claim available card"
  on public.claim_session_cards for update
  using (status = 'available' and auth.uid() is not null)
  with check (
    status = 'claimed'
    and claimed_by_user_id = auth.uid()
    and claimed_at is not null
  );

-- ─── AUCTION TRANSACTIONS ──────────────────────────────────────────────────

-- Make listing_id nullable so payment_events can come from an auction
alter table public.payment_events
  alter column listing_id drop not null;

-- Add optional columns linking to the auction
alter table public.payment_events
  add column if not exists auction_id   uuid references public.auction_listings(id) on delete set null,
  add column if not exists seller_id    uuid references auth.users(id) on delete set null,
  add column if not exists seller_handle text;

-- Backfill seller_id for existing market-listing transactions
update public.payment_events pe
set    seller_id    = ml.seller_id,
       seller_handle = ml.seller_handle
from   public.market_listings ml
where  pe.listing_id = ml.id
  and  pe.seller_id is null;

create index if not exists idx_payment_events_seller   on public.payment_events(seller_id);
create index if not exists idx_payment_events_auction  on public.payment_events(auction_id);

-- ─── ONBOARDING FLAG ───────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;
