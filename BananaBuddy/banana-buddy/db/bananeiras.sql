-- ============================================================
-- Banana Buddy — Bananeiras (social clans) schema
-- Rodar no Supabase SQL Editor
-- ============================================================

-- Tabelas
create table bananeiras (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  founder_id uuid references auth.users not null,
  created_at timestamptz default now()
);

create table bananeira_members (
  bananeira_id uuid references bananeiras on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (bananeira_id, user_id)
);

create table pokes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references auth.users not null,
  to_user uuid references auth.users not null,
  from_name text not null,
  bananeira_id uuid references bananeiras on delete cascade,
  created_at timestamptz default now(),
  seen boolean default false
);

-- ============================================================
-- Helpers security definer (evitam recursão infinita no RLS)
-- ============================================================

create or replace function public.is_member(b_id uuid, u_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  select exists (
    select 1 from public.bananeira_members
    where bananeira_id = b_id and user_id = u_id
  );
$$;

create or replace function public.shares_bananeira(other_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  select exists (
    select 1 from public.bananeira_members m1
    join public.bananeira_members m2 on m1.bananeira_id = m2.bananeira_id
    where m1.user_id = auth.uid() and m2.user_id = other_id
  );
$$;

-- ============================================================
-- RPCs — resolvem o "ovo-galinha" de criar/entrar sob RLS
-- ============================================================

create or replace function public.create_bananeira(p_name text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
  new_code text;
begin
  new_code := upper(substring(md5(random()::text) from 1 for 6));
  insert into public.bananeiras (name, code, founder_id)
    values (p_name, new_code, auth.uid())
    returning id into new_id;
  insert into public.bananeira_members (bananeira_id, user_id, role)
    values (new_id, auth.uid(), 'founder');
  return json_build_object('id', new_id, 'code', new_code);
end;
$$;

create or replace function public.join_bananeira(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_id uuid;
begin
  select id into target_id
    from public.bananeiras
    where code = upper(trim(p_code));
  if target_id is null then
    raise exception 'Bananeira não encontrada';
  end if;
  insert into public.bananeira_members (bananeira_id, user_id)
    values (target_id, auth.uid())
    on conflict do nothing;
  return target_id;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table bananeiras enable row level security;
alter table bananeira_members enable row level security;
alter table pokes enable row level security;

create policy "read own bananeiras"
  on bananeiras for select
  using (public.is_member(id, auth.uid()));

create policy "read co-members"
  on bananeira_members for select
  using (public.is_member(bananeira_id, auth.uid()));

-- Libera leitura do perfil de qualquer co-membro
-- (a policy "self" existente já cobre o próprio usuário)
create policy "read co-member profiles"
  on profiles for select
  using (public.shares_bananeira(id));

create policy "send poke"
  on pokes for insert
  with check (from_user = auth.uid());

create policy "read my pokes"
  on pokes for select
  using (to_user = auth.uid());

create policy "mark poke seen"
  on pokes for update
  using (to_user = auth.uid());

-- ============================================================
-- View bananeira_overview (contagem de membros)
-- ============================================================

create view bananeira_overview with (security_invoker = true) as
  select
    b.id,
    b.name,
    b.code,
    b.founder_id,
    (select count(*) from public.bananeira_members m where m.bananeira_id = b.id)::int as member_count
  from public.bananeiras b;
