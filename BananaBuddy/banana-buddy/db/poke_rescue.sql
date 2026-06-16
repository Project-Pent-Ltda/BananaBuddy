-- ============================================================
-- Banana Buddy — Cutucada com resgate (utilidade real do poke)
-- Rodar no Supabase SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists support_count integer default 0;

alter table public.pokes
  add column if not exists redeemed_at timestamptz;

create table public.rescue_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  rescued_name text not null,
  bonus integer default 10,
  seen boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- RPC — resgata pokes pendentes do usuário ao registrar atividade
-- ============================================================

create or replace function public.redeem_pending_pokes()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  redeemed_count integer := 0;
  rescued_name text;
  p record;
begin
  select buddy_name into rescued_name from public.profiles where id = auth.uid();

  for p in
    select id, from_user from public.pokes
    where to_user = auth.uid()
      and redeemed_at is null
      and created_at > now() - interval '24 hours'
  loop
    update public.pokes set redeemed_at = now() where id = p.id;
    update public.profiles set support_count = support_count + 1 where id = p.from_user;
    insert into public.rescue_notifications (user_id, rescued_name)
      values (p.from_user, coalesce(rescued_name, 'Banana'));
    redeemed_count := redeemed_count + 1;
  end loop;

  return redeemed_count;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.rescue_notifications enable row level security;

create policy "read my rescues"
  on public.rescue_notifications for select
  using (user_id = auth.uid());

create policy "mark rescue seen"
  on public.rescue_notifications for update
  using (user_id = auth.uid());

-- Sem policy de insert: só o RPC security-definer escreve nesta tabela.
