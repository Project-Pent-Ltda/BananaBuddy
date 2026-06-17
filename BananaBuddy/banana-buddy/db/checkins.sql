-- ============================================================
-- Banana Buddy — Check-ins (feed com foto de prova)
-- Rodar no Supabase SQL Editor
-- ============================================================

-- Tabela de check-ins (um post de treino com foto)
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users on delete cascade not null,
  sport_id text not null,
  photo_url text not null,
  title text default '',
  description text default '',
  duracao text default '',
  distancia text default '',
  calorias text default '',
  passos text default '',
  created_at timestamptz default now()
);

create index if not exists checkins_author_created_idx
  on public.checkins (author_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.checkins enable row level security;

-- Autor só insere check-in em nome próprio
create policy "insert own checkin"
  on public.checkins for insert
  with check (author_id = auth.uid());

-- Leitura: o próprio autor OU qualquer co-membro de Bananeira
-- (reaproveita o helper shares_bananeira de db/bananeiras.sql)
create policy "read co-member checkins"
  on public.checkins for select
  using (author_id = auth.uid() or public.shares_bananeira(author_id));

-- Autor pode apagar o próprio check-in
create policy "delete own checkin"
  on public.checkins for delete
  using (author_id = auth.uid());

-- ============================================================
-- Storage — bucket público para as fotos de prova
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('checkins', 'checkins', true)
  on conflict (id) do nothing;

-- Upload: usuário autenticado só envia para a própria pasta (<uid>/...)
create policy "upload own checkin photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leitura pública das fotos (bucket público)
create policy "public read checkin photos"
  on storage.objects for select
  using (bucket_id = 'checkins');
