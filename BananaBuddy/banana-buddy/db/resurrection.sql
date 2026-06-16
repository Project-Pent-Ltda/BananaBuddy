-- ============================================================
-- Banana Buddy — Ressurreição da banana
-- Rodar no Supabase SQL Editor
-- ============================================================

create table public.resurrection_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  from_name text not null,
  bananeira_name text not null,
  seen boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- RPC — registra ressurreição e notifica co-membros da Bananeira
-- ============================================================

create or replace function public.register_resurrection(p_bananeira_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  caller_name text;
  bananeira_name text;
  was_rotten boolean;
  member_id uuid;
begin
  -- Verifica se o usuário estava podre (7+ dias sem atividade)
  select
    buddy_name,
    (last_activity_date is null or last_activity_date <= current_date - 7)
  into caller_name, was_rotten
  from public.profiles
  where id = auth.uid();

  if not was_rotten then
    return false;
  end if;

  select name into bananeira_name from public.bananeiras where id = p_bananeira_id;

  -- Notifica cada co-membro (exceto o próprio usuário)
  for member_id in
    select user_id from public.bananeira_members
    where bananeira_id = p_bananeira_id
      and user_id <> auth.uid()
  loop
    insert into public.resurrection_notifications (user_id, from_name, bananeira_name)
      values (member_id, coalesce(caller_name, 'Alguém'), coalesce(bananeira_name, 'Bananeira'));
  end loop;

  return true;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.resurrection_notifications enable row level security;

create policy "read my resurrections"
  on public.resurrection_notifications for select
  using (user_id = auth.uid());

create policy "mark resurrection seen"
  on public.resurrection_notifications for update
  using (user_id = auth.uid());

-- Sem policy de insert: só o RPC security-definer escreve nesta tabela.
