-- migrate-v15.sql
-- Trust Foundation: canonical seller ratings and duplicate protection.

update public.reputation_events
set event_type = 'rating_submitted'
where event_type = 'rating';

alter table public.reputation_events
  drop constraint if exists reputation_events_event_type_check;

alter table public.reputation_events
  add constraint reputation_events_event_type_check
  check (event_type in ('sale_completed', 'buyer_report', 'manual_review', 'rating_submitted'));

create index if not exists idx_reputation_events_seller_rating
  on public.reputation_events (seller_id, created_at desc)
  where event_type = 'rating_submitted';

create unique index if not exists idx_reputation_events_rating_once
  on public.reputation_events (
    (metadata->>'transaction_id'),
    (metadata->>'rater_id'),
    seller_id
  )
  where event_type = 'rating_submitted'
    and metadata ? 'transaction_id'
    and metadata ? 'rater_id';

