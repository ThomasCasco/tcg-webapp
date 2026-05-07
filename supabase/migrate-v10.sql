-- ---------------------------------------------------------------------
-- Social interactions: follows + trade proposals
-- ---------------------------------------------------------------------

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
    status in ('pending', 'accepted', 'declined', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposer_id <> recipient_id)
);

create index if not exists idx_profile_follows_following
  on public.profile_follows(following_id, created_at desc);

create index if not exists idx_profile_follows_follower
  on public.profile_follows(follower_id, created_at desc);

create index if not exists idx_trade_proposals_proposer
  on public.trade_proposals(proposer_id, created_at desc);

create index if not exists idx_trade_proposals_recipient
  on public.trade_proposals(recipient_id, created_at desc);

create index if not exists idx_trade_proposals_status
  on public.trade_proposals(status);

alter table public.profile_follows enable row level security;
alter table public.trade_proposals enable row level security;

drop policy if exists "profile_follows_read_all" on public.profile_follows;
create policy "profile_follows_read_all" on public.profile_follows
  for select using (true);

drop policy if exists "profile_follows_owner_write" on public.profile_follows;
create policy "profile_follows_owner_write" on public.profile_follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "trade_proposals_parties_read" on public.trade_proposals;
create policy "trade_proposals_parties_read" on public.trade_proposals
  for select using (auth.uid() = proposer_id or auth.uid() = recipient_id);

drop policy if exists "trade_proposals_proposer_create" on public.trade_proposals;
create policy "trade_proposals_proposer_create" on public.trade_proposals
  for insert with check (auth.uid() = proposer_id);

drop policy if exists "trade_proposals_parties_update" on public.trade_proposals;
create policy "trade_proposals_parties_update" on public.trade_proposals
  for update using (auth.uid() = proposer_id or auth.uid() = recipient_id)
  with check (auth.uid() = proposer_id or auth.uid() = recipient_id);
