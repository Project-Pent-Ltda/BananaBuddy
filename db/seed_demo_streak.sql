-- Deixa o usuário com streak de 6 dias para o pitch.
-- Ao registrar o primeiro treino no app, o streak vai a 7,
-- ganha o escudo 🛡️ e o modal de "Persistente" aparece.
--
-- Como rodar: Supabase → SQL Editor → cole e execute.
-- Substitua o ID abaixo pelo seu (Authentication → Users).

UPDATE profiles
SET
  current_streak     = 6,
  longest_streak     = 6,
  streak_shields     = 0,
  last_activity_date = CURRENT_DATE - INTERVAL '1 day'
WHERE id = 'SEU_USER_ID_AQUI';
