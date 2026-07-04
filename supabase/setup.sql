-- ============================================================
-- GYMTRACK — SÉCURITÉ SUPABASE (B5 + support B7)
--
-- À exécuter UNE FOIS dans le SQL Editor du dashboard Supabase
-- (https://supabase.com/dashboard → ton projet → SQL Editor → New query).
-- Idempotent : ré-exécutable sans casse.
--
-- Ce script :
--   1. Crée les tables si absentes (même forme que le client attend)
--   2. Active RLS + policies « chacun ne voit que ses lignes »
--   3. Crée la fonction delete_user() appelée par la suppression
--      de compte in-app (lib/account.ts)
-- ============================================================

-- ── 1. TABLES ────────────────────────────────────────────────
-- Blobs JSON, même forme que SQLite local (voir docs/00-ARCHITECTURE.md)

create table if not exists public.workouts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_workouts_user on public.workouts (user_id);
create index if not exists idx_plans_user on public.plans (user_id);
create index if not exists idx_goals_user on public.goals (user_id);

-- ── 2. ROW LEVEL SECURITY ────────────────────────────────────
-- L'anon key est publique : SANS ces policies, n'importe qui lit tout.

alter table public.workouts enable row level security;
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.goals enable row level security;

-- workouts
drop policy if exists "own rows only" on public.workouts;
create policy "own rows only" on public.workouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profiles
drop policy if exists "own rows only" on public.profiles;
create policy "own rows only" on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- plans
drop policy if exists "own rows only" on public.plans;
create policy "own rows only" on public.plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- goals
drop policy if exists "own rows only" on public.goals;
create policy "own rows only" on public.goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. SUPPRESSION DE COMPTE (appelée par lib/account.ts) ───
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire de la
-- fonction, seul moyen pour un client de supprimer SON utilisateur auth.
-- Ne supprime QUE l'utilisateur courant (auth.uid()), jamais un autre.
-- Les lignes des 4 tables partent via ON DELETE CASCADE.

create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

-- Seuls les utilisateurs connectés peuvent l'appeler
revoke execute on function public.delete_user() from anon, public;
grant execute on function public.delete_user() to authenticated;

-- ============================================================
-- VÉRIFICATION (à exécuter après, doit être vide sans session) :
--   select * from public.workouts;   -- 0 ligne avec l'anon key seule
--
-- Test complet côté app : docs/05-SECURITY.md §3
-- ============================================================
