-- =====================================================================
-- Migration v5: fotos (Storage bucket) + reservas con timestamp
-- =====================================================================
-- Idempotente. Ejecutar DESPUES de migrate-v4.sql (o v3 si no usas v4).
-- =====================================================================

-- Cuando el comprador reserva, guardamos cuándo empezó el pago pendiente.
alter table if exists public.market_listings
  add column if not exists reserved_at timestamptz;

create index if not exists idx_market_listings_pending_reserved
  on public.market_listings (reserved_at)
  where status = 'pending_payment';

-- ---------------------------------------------------------------------
-- Storage: bucket publico para imagenes de cartas (subida via API server)
-- Plan gratuito Supabase: ~1 GB storage (suficiente para MVP).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-images',
  'card-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura publica de objetos (URLs publicas del bucket)
drop policy if exists "card_images_public_read" on storage.objects;
create policy "card_images_public_read"
  on storage.objects for select
  using (bucket_id = 'card-images');

-- Nota: las subidas las hace el backend con SUPABASE_SERVICE_ROLE_KEY
-- (no requiere policy de INSERT para usuarios anonimos).
