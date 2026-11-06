-- Okilo cloud schema. Run once in Supabase → SQL Editor.
-- Each row is a JSON blob validated by the app (domain/schemas.ts); RLS keeps every user on their own rows.

create table if not exists public.workouts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists workouts_user_id_idx on public.workouts (user_id);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- The settings that follow the account (program days, sets and reps, plates…); updated_at is when they changed on the phone
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.workouts enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "own workouts" on public.workouts;
create policy "own workouts" on public.workouts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- Account recovery (supabase/functions/). Read and written only by the Edge Functions with the
-- service role: RLS on and no policy, so the app (anon, authenticated) can neither read nor write.
-- ------------------------------------------------------------

-- The slow hash (PBKDF2) of each account's recovery code, never the code itself
create table if not exists public.recovery_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now()
);

-- Recovery attempts per username, IP or account, for the rate limit
create table if not exists public.recovery_attempts (
  id bigint generated always as identity primary key,
  key text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists recovery_attempts_key_idx on public.recovery_attempts (key, attempted_at);

alter table public.recovery_codes enable row level security;
alter table public.recovery_attempts enable row level security;
revoke all on public.recovery_codes, public.recovery_attempts from anon, authenticated;

-- The account behind a sign-in address, and its contact email: for the Edge Functions only
create or replace function public.recovery_lookup(p_email text)
returns table (user_id uuid, contact_email text)
language sql
security definer
set search_path = ''
as $$
  select u.id, nullif(u.raw_user_meta_data ->> 'contact_email', '')
  from auth.users u
  where u.email = lower(p_email);
$$;
revoke execute on function public.recovery_lookup(text) from public, anon, authenticated;
grant execute on function public.recovery_lookup(text) to service_role;
