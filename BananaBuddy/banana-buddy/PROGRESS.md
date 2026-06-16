# Banana Buddy — Progresso

Registro de checkpoints do desenvolvimento. Atualizado a cada sessão.

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
