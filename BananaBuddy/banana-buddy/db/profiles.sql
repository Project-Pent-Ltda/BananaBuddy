-- ============================================================
-- Banana Buddy — profiles
-- Documentação do schema real (criado direto no Supabase no
-- CHECKPOINT 2, sem DDL versionado até agora). Reconstruído via
-- information_schema + pg_policies — não rodar este CREATE TABLE
-- se a tabela já existe.
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users,
  buddy_name text default '',
  active_skin text default 'base',
  is_on_fire boolean default false,
  practiced_sports jsonb default '{}',
  raios integer default 0,
  unlocked_store_skins text[] default '{}',
  onboarding_done boolean default false,
  created_at timestamptz default now(),
  -- Streak (GAP #3, db/streak.sql — adicionado em 2026-06-16)
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  streak_shields integer default 0
);

-- ============================================================
-- RLS (verificado em 2026-06-15 — ambos confirmados ligados/corretos)
-- ============================================================

alter table public.profiles enable row level security;

-- Cobre SELECT/INSERT/UPDATE/DELETE do próprio usuário.
-- with_check não é especificado, então o Postgres reusa a
-- expressão USING também como WITH CHECK.
create policy "self"
  on public.profiles for all
  using (auth.uid() = id);

-- Estende leitura aos perfis de co-membros de Bananeira
-- (definida em db/bananeiras.sql, depende de shares_bananeira()).
create policy "read co-member profiles"
  on public.profiles for select
  using (public.shares_bananeira(id));

-- ============================================================
-- Trigger handle_new_user (cria o profile no signup, roda como
-- security definer — não é bloqueado pelas policies acima)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, buddy_name)
    values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
