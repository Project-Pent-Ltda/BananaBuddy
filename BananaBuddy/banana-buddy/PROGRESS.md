# Banana Buddy — Progresso

Registro de checkpoints do desenvolvimento. Atualizado a cada sessão.

---

## ✅ CHECKPOINT 6 — 2026-06-16: Streak real (GAP #3) + polish do mapa

**O que foi feito:**
- **Streak de verdade** (endereça GAP #3 do `GAPS.md`): 4 colunas novas em
  `profiles` (`current_streak`, `longest_streak`, `last_activity_date`,
  `streak_shields`) via `db/streak.sql` (já rodada pelo usuário no Supabase).
  - `reconcileStreak` (dentro de `loadProfile`, `src/App.tsx`): ao abrir o app,
    detecta dias perdidos. 1 dia perdido com escudo disponível → perdoa e
    consome o escudo. 2+ dias sem escudo → zera o streak.
  - `registerDailyActivity()`, chamada de dentro de `updateProgress` (usada
    tanto na tela de Conquistas quanto no "Registrar treino" do mapa): soma
    +1/dia, nunca duplica no mesmo dia, concede 1 escudo automaticamente ao
    chegar em 7 dias.
  - Badge de marco (🏅 Persistente/Aura Dourada/Inabalável/Lendário) baseado no
    **maior streak já alcançado** (`longest_streak`), não no atual.
  - UI: chip 🔥/🛡️/🏅 no Dashboard; chip 🔥 também no card de detalhe da
    banana no mapa (`BananeiraMember` ganhou campo `streak`, lido via
    `current_streak` em `lib/bananeiras.ts`).
  - **Decisão explícita:** GAP #2 (a banana apodrecer visualmente com base em
    tempo — os 7 estados de humor da PRD) **não foi tocado**, fica pra outra
    sessão. `isOnFire`/mood continuam manuais, sem lógica de data.
  - Testado ao vivo pelo usuário: ganhar o escudo aos 7 dias (simulado via SQL
    pra não esperar dias reais) e exibição no Dashboard + mapa. ✅ funcionando.

- **Bugs do mapa corrigidos** (sessão anterior, mesma rodada de commits):
  - Cutucada: toast de status agora limpa sozinho depois de 3s (antes ficava
    preso na tela pra sempre).
  - Posição das bananas no mapa: trocada de aleatória (`Math.random`, diferente
    por dispositivo/reload) para **determinística por hash do `userId`** — cada
    pessoa sempre aparece no mesmo lugar, em qualquer dispositivo.
  - Esconder o card de ranking não move mais as bananas: camada do mapa virou
    `absolute inset-0` (tamanho fixo), header+ranking flutuam por cima sem
    afetar o layout/porcentagens do mapa.

**Pendente (registrado em `GAPS.md`, item 1, gaps secundários):**
- Seed de dados demo (Bananeira de mentira com membros e sessões pra não
  começar o pitch zerado).
- Dar utilidade real à cutucada (hoje só é um toast social, sem efeito de jogo).
- GAP #2 (decaimento visual da banana por tempo) — análise completa já feita
  (ver histórico do chat anterior), só não implementada ainda.

**⚠️ Não commitado ainda nesta sessão** (rodar `git status` pra confirmar):
`db/streak.sql` (novo), `db/profiles.sql`, `lib/bananeiras.ts`, `src/App.tsx`.

---

## ✅ CHECKPOINT 5 — 2026-06-15: Deploy no Vercel + fix do mapa de Bananeiras

**O que foi feito:**
- App publicado no Vercel: `https://banana-buddy.vercel.app/` (Root Directory
  `BananaBuddy/banana-buddy`, env vars `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`).
- Auditoria de RLS no Supabase (`db/check_rls.sql`): confirmado RLS ligado e
  policies corretas em `profiles`, `bananeiras`, `bananeira_members`, `pokes` —
  nenhuma alteração necessária. Schema de `profiles` documentado em `db/profiles.sql`
  (não existia DDL versionado até então).
- READMEs corrigidos (raiz mantém o pitch, mas com nota de "visão-alvo"; o aninhado
  trocou as instruções erradas do template AI Studio pelo setup real com Supabase).
- **Bug corrigido:** `fetchBananeiraMembers` (`lib/bananeiras.ts`) dava erro 400 —
  fazia um "join embutido" `bananeira_members → profiles` que depende de uma FK
  direta entre as duas tabelas, que não existe (ambas referenciam só `auth.users`).
  Reescrito como duas queries separadas, unidas em JS. Esse era o motivo de
  **nenhuma banana aparecer no mapa**, nem a do próprio usuário — confirmado em
  teste real com 2 contas.
- `App.tsx`: o `.catch(() => {})` do fetch do mapa agora loga o erro no console,
  em vez de falhar silenciosamente (facilita debug de problemas futuros).

**Pendente (próxima rodada, Parte F do plano):**
- Bug: skin escolhida não aparece na própria banana no mapa (mapa lê do banco com
  latência; precisa usar estado local pro próprio usuário).
- Features: registrar treino direto do mapa, pódio/destaque do líder, mais info
  por membro (esporte principal, fundador, contagem), seed de dados demo.

---

## ✅ CHECKPOINT 4 — 2026-06-15: Bananeiras reais (Supabase)

**O que foi feito (GAP #1 do `GAPS.md`, agora endereçado):**
- `db/bananeiras.sql` — tabelas `bananeiras`, `bananeira_members`, `pokes`; RPCs `create_bananeira`/`join_bananeira` (security definer, resolvem o ovo-galinha de RLS); helpers `is_member`/`shares_bananeira`; view `bananeira_overview` (contagem de membros); policy `"read co-member profiles"` liberando leitura de perfis de co-membros. Rodado com sucesso no SQL Editor pelo usuário.
- `lib/bananeiras.ts` (novo) — camada de dados fina: `fetchMyBananeiras`, `createBananeira`, `joinBananeira`, `fetchBananeiraMembers` (join com `profiles`, ranking = soma de `practiced_sports`), `sendPoke`, `fetchUnseenPokes`, `markPokesSeen`.
- `BananeiraSelectionScreen` reescrita: lista real de grupos do usuário, "Entrar com código", "Criar Bananeira" (mostra o código gerado para compartilhar).
- `BananeiraMapScreen` reescrita: membros reais no mapa flutuante, painel de Ranking ordenado por score, botão de refresh manual (sem real-time, por decisão do usuário), modal de detalhe com "Cutucar".
- Wiring no `App.tsx`: estado `currentBananeira`, navegação `selection → map` passando id/nome reais; `useEffect` ao entrar no dashboard checa `fetchUnseenPokes()` e mostra toast "Fulano te cutucou! 👈".

**Pendente de teste pelo usuário (fluxo completo, 2 contas):**
- Conta A: criar Bananeira → ver e copiar código.
- Conta B (outra aba/perfil): entrar com o código → cair no mapa.
- Ambas abrem o mapa → ver as 2 bananas reais; ranking ordenado por sessões praticadas.
- A cutuca B → B abre o dashboard → toast da cutucada aparece.
- (Opcional) Conta C não-membro não deve ver a Bananeira nem os perfis dos membros (RLS).

**Pendente (fora desta sessão):** seeding de 2-3 contas demo com uma Bananeira compartilhada e `practiced_sports` preenchido, para o pitch não começar com ranking zerado.

---

## ✅ CHECKPOINT 3 — 2026-06-15: Sync de skins

**O que foi feito:**
- `DEMO_ALL_UNLOCKED = true` no topo de `App.tsx` — flag única para apresentação
- Array `SKINS: SkinDef[]` centralizado com 9 skins (base, ballet, boxe, cycle, judo, run, soccer, swim, yoga) — fonte única de verdade
- Tipos discriminados `FreeSkin | StoreSkin | AchievementSkin` para type-safety
- Helper `isSkinUnlocked()` com discriminated union (acesso seguro a `.price` / `.sport`)
- `CustomizationScreen` substituída: grid 3 colunas, `BananaIcon` animado por card, badge de estado
- `SplashScreen` usando `SKINS.map(s => s.id)` em vez de array hardcoded

**Pendente de teste:**
- Navegar até customização → 9 cards em grid, todas desbloqueadas
- Clicar skin → avatar do dashboard muda
- Splash cicla corretamente todas as skins

---

## ✅ CHECKPOINT 2 — 2026-06-15: Login + Supabase Auth

**O que foi feito:**
- `lib/supabase.ts` criado com JWT anon key
- `.env` com URL e chave (não commitado)
- `App.tsx` com auth real: `onAuthStateChange`, `loadProfile`, `saveProfile` (debounce 500ms)
- `LoginScreen` com tabs Entrar / Cadastrar
- Logout no dashboard (ícone `LogOut` canto superior direito)
- Trigger `handle_new_user` com `set search_path = ''` e schema explícito
- Confirmação de email desativada no Supabase
- Press Start 2P font no título da login
- Avatar `banana_yoga_4.png` no header da login

**Pendente de teste:**
- Logout → login com usuário existente → verificar que dados persistem
- Verificar que `onboarding_done = true` é salvo ao completar onboarding

---

## ✅ CHECKPOINT 1 — 2026-06-15: Setup inicial

**O que foi feito:**
- Projeto criado com Vite 6 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- 8 telas implementadas: splash → login → health → onboarding → dashboard → customization → bananeira-selection → bananeira-map → achievements
- Avatar `BananaIcon` com animação frame-a-frame (9 skins, 4 frames cada)
- Estado global em memória no `App.tsx`
