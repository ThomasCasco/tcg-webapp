-- Add back_image_url to inventory_entries for front/back card photos
alter table if exists public.inventory_entries
  add column if not exists back_image_url text;
