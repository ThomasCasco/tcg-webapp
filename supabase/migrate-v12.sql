-- Trades fisicos: aceptar no transfiere inventario.
-- El inventario se mueve solo cuando ambas partes confirman que el intercambio se realizo.

alter table if exists public.trade_proposals
  add column if not exists proposer_confirmed_at timestamptz;

alter table if exists public.trade_proposals
  add column if not exists recipient_confirmed_at timestamptz;

alter table if exists public.trade_proposals
  drop constraint if exists trade_proposals_status_check;

alter table if exists public.trade_proposals
  add constraint trade_proposals_status_check check (
    status in ('pending', 'accepted', 'completed', 'declined', 'cancelled')
  );
