-- ============================================================
-- Banana Buddy — Streak (GAP #3 do GAPS.md)
-- Rodar no Supabase SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists current_streak integer default 0,
  add column if not exists longest_streak integer default 0,
  add column if not exists last_activity_date date,
  add column if not exists streak_shields integer default 0;

-- RLS não muda: a policy "self" existente (for all, using (auth.uid() = id))
-- já cobre leitura/escrita dessas colunas novas.
