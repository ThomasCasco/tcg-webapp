-- =====================================================================
-- Migration v4: perfil de cobro para sellers (P2P buyer <-> seller)
-- =====================================================================
-- Ejecutar DESPUES de migrate-v3.sql.
-- Idempotente.
-- =====================================================================

alter table if exists public.profiles
  add column if not exists payment_provider text not null default 'mercado_pago' check (
    payment_provider in ('mercado_pago', 'bank_transfer', 'cash', 'other')
  );

alter table if exists public.profiles
  add column if not exists payment_alias text;

alter table if exists public.profiles
  add column if not exists payment_instructions text;

update public.profiles
set payment_provider = 'mercado_pago'
where payment_provider is null;
