-- =====================================================================
-- Migration v6: logística P2P (envío / retiro + notas de ubicación)
-- =====================================================================
-- Idempotente. Ejecutar DESPUES de migrate-v5.sql.
-- =====================================================================

alter table if exists public.market_listings
  add column if not exists offers_shipping boolean not null default false;

alter table if exists public.market_listings
  add column if not exists offers_pickup boolean not null default false;

alter table if exists public.market_listings
  add column if not exists delivery_area_notes text;

comment on column public.market_listings.offers_shipping is 'El vendedor ofrece envío (detalle en delivery_area_notes).';
comment on column public.market_listings.offers_pickup is 'El vendedor ofrece retiro en persona.';
comment on column public.market_listings.delivery_area_notes is 'Texto libre: zona de retiro, couriers, costos, horarios.';
