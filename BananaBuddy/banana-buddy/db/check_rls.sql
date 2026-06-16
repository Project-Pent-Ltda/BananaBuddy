-- ============================================================
-- Checagem de RLS antes de expor a URL publicamente
-- Rodar no Supabase SQL Editor (read-only, só consulta)
-- ============================================================

-- (1) RLS precisa estar LIGADO (rls_ligado = true) nas 4 tabelas.
-- Se "profiles" vier false, a tabela está 100% exposta via anon key.
select relname as tabela, relrowsecurity as rls_ligado
from pg_class
where relname in ('profiles','bananeiras','bananeira_members','pokes')
order by relname;

-- (2) Listar todas as policies para inspecionar as de "profiles".
-- O que checar:
--   SELECT  -> qual deve ser (id = auth.uid()) ou shares_bananeira(id).
--             Se aparecer qual = true, qualquer perfil é legível por qualquer um.
--   INSERT/UPDATE -> with_check DEVE ser (id = auth.uid()).
--             Se for true/null, a conta B pode sobrescrever o perfil da conta A.
--   DELETE  -> idealmente inexistente, ou escopado a (id = auth.uid()).
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
