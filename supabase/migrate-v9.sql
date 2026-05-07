-- ---------------------------------------------------------------------
-- Social profiles: public collector identity + completion score inputs
-- ---------------------------------------------------------------------

alter table if exists public.profiles
  add column if not exists display_name text;

alter table if exists public.profiles
  add column if not exists bio text;

alter table if exists public.profiles
  add column if not exists location text;

alter table if exists public.profiles
  add column if not exists avatar_url text;

alter table if exists public.profiles
  add column if not exists favorite_game text;

alter table if exists public.profiles
  add column if not exists favorite_card text;

alter table if exists public.profiles
  add column if not exists instagram text;

alter table if exists public.profiles
  add column if not exists discord text;

create index if not exists idx_profiles_username_search
  on public.profiles(username);

create index if not exists idx_profiles_updated
  on public.profiles(updated_at desc);
