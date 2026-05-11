-- Subastas programadas: nueva fase previa antes de "active".
-- + Suscripciones de usuarios para recibir aviso al iniciar.

alter table if exists public.auction_listings
  drop constraint if exists auction_listings_status_check;

alter table if exists public.auction_listings
  add constraint auction_listings_status_check check (
    status in ('scheduled', 'active', 'ended', 'cancelled', 'settled')
  );

alter table if exists public.auction_listings
  alter column starts_at drop default;

create index if not exists idx_auction_listings_scheduled_start
  on public.auction_listings(status, starts_at)
  where status = 'scheduled';

-- Suscripciones: notifico cuando una subasta programada arranca.
create table if not exists public.auction_subscriptions (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auction_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (auction_id, user_id)
);

create index if not exists idx_auction_subs_user
  on public.auction_subscriptions(user_id, created_at desc);
create index if not exists idx_auction_subs_auction
  on public.auction_subscriptions(auction_id);

alter table if exists public.auction_subscriptions enable row level security;

create policy "auction_subs_owner_read" on public.auction_subscriptions
  for select using (auth.uid() = user_id);

create policy "auction_subs_owner_write" on public.auction_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reactivar la lectura pública para incluir 'scheduled'.
drop policy if exists "auction_listings_public_read" on public.auction_listings;
create policy "auction_listings_public_read" on public.auction_listings
  for select using (
    status in ('scheduled', 'active', 'ended', 'settled') or auth.uid() = seller_id
  );
