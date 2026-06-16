# Análise de Gaps — Banana Buddy

Diagnóstico honesto do protótipo atual comparado à tese do produto: **"Gym Rats, mas gamificado"** — um app de fitness social (feed + ranking + prova de treino) com um avatar-banana que reflete emocionalmente o esforço do usuário.

Documento de backlog priorizado. Atualizado em 2026-06-16.

---

## O problema central

O que torna o Gym Rats viciante é o **loop de responsabilidade social**: você loga um treino (com foto de prova) → seus amigos veem no feed → o ranking atualiza → vêm reações e cobrança. O diferencial do Banana Buddy seria gamificar isso com a banana que reflete seu estado.

O problema é que **os dois pilares da tese — pressão social e a banana que apodrece — estão mockados.** Funcionam visualmente no protótipo, mas não existem de fato no código.

---

## Inventário do código atual

Verificado em `src/App.tsx` (~980 linhas, arquivo único).

| Área | Estado | Profundidade |
|------|--------|--------------|
| Avatar (skins) | ✅ Real | 9 skins, unlock por conquista/loja, grid de customização |
| Persistência (Supabase) | ✅ Real | 6 campos persistidos com debounce |
| Auth (login/cadastro) | ✅ Real | Supabase Auth, tabs Entrar/Cadastrar |
| Moods da banana | 🟡 Parcial | happy/on-fire/dead via `bananaDecayState()` baseado em `lastActivityDate`; estados intermediários sem arte nova (filtro CSS) |
| Bananeiras (social) | ✅ Real | Criar/entrar por código, ranking real (soma de sessões), cutucar com loop de resgate |
| Registro de treino | 🔴 Raso | Botão "+1" → +20 raios, sem data/duração/prova |
| Integração de saúde | 🔴 Fachada | Toggles Apple/Google sem nenhuma chamada de API |
| Streak | ✅ Real | Contador de dias seguidos, escudo a cada 7 dias, badge de título por marco |
| Decaimento (visual) | ✅ Real | Filtros CSS por dias sem treinar; 3 estágios no mapa e no Dashboard |
| Ressurreição | ✅ Real | Modal dramático ao treinar com banana podre; co-membros notificados |

---

## Fraquezas em ordem de impacto

### 1. ✅ O loop social — CONCLUÍDO (2026-06-15 / 2026-06-16)

As Bananeiras são reais, backed por Supabase: criar/entrar por código (RPC `create_bananeira`/`join_bananeira`), membros e ranking computados de verdade (`bananeira_overview`, `bananeira_members` × `profiles`).

**Cutucada com utilidade real (2026-06-16):**
- Membros em risco (2+ dias sem treinar) aparecem com filtro de decaimento + emoji de estado no mapa.
- Botão muda para "🍌 Cutucar pra salvar!" em vez de cutucar genérico.
- Cutucado recebe pop-up modal central com "Treinar agora" / "Depois".
- Se o cutucado treinar em 24h: quem cutucou ganha +10 raios + badge 🤝 Apoiador ×N + modal de confirmação.
- Migration: `db/poke_rescue.sql` (tabela `rescue_notifications`, RPC `redeem_pending_pokes`).

Mapa com fundo pixel art, pódio/destaque do líder, esporte principal e badge de fundador por membro, registro de treino direto do mapa, polling silencioso a cada 5s.

**Pendente (não bloqueia pitch):**
- **Seeding de contas demo** — Bananeira de demonstração com 2-3 membros e `practiced_sports` preenchido, pra não começar com ranking zerado.

### 2. 🟡 A banana apodrece — PARCIALMENTE ENDEREÇADO (2026-06-16)

Helper `bananaDecayState()` implementado com os estados do PRD §4.2 via **filtros CSS** (sem arte nova):

| Dias sem treinar | Estado | Efeito visual |
|-----------------|--------|---------------|
| 0–1 | Saudável | sem filtro |
| 2–3 | 😐 Amadurecendo | sépia leve |
| 4–6 | 😰 Quase Podre | sépia forte + grayscale |
| 7+ | 💀 Podre | grayscale + escuro + mood `dead` |

Aplicado no mapa (banana de cada membro) e no Dashboard (banana própria + texto de urgência colorido: "SUA BANANA APODRECEU. Ressuscita!").

**Ressurreição (2026-06-16):** ao treinar com banana podre, modal dramático "+50 raios, sua banana voltou dos mortos! 🍌🔥"; co-membros recebem notificação no próximo acesso ao Dashboard. Migration: `db/resurrection.sql`.

**Pendente:**
- Estados intermediários (Amadurecendo / Quase Podre) no Dashboard dependem de novos sprites — atualmente só o estado `dead` muda o frame da banana própria; os outros dois são só filtro.

### 3. ✅ Streak — CONCLUÍDO (2026-06-16)

Streak de dias consecutivos totalmente implementado e persistido no Supabase:

- Contador de dias seguidos exibido no Dashboard e no card do mapa.
- **Escudo** (`streak_shields`): ganho a cada 7 dias de streak. Protege contra 1 falta (gap de 2 dias sem treinar); gap ≥ 3 dias zera o streak mesmo com escudo.
- **Badges de título** baseadas no streak atual (não no recorde histórico — somem se o streak cair):

| Streak | Badge |
|--------|-------|
| 7 dias | 🏅 Persistente |
| 14 dias | 🏅 Aura Dourada |
| 30 dias | 🏅 Inabalável |
| 90 dias | 🏅 Lendário |

- Badge exibida como chip dourado no Dashboard e no card do mapa.
- Modal de conquista ao bater 7 dias: banana animada + chip `🏅 Persistente` em destaque.
- Script de demo: `db/seed_demo_streak.sql` — deixa o usuário com streak=6, shields=0, last_activity=ontem. **Após rodar o SQL, recarregar o app antes de treinar** (estado em memória não sincroniza automaticamente com o banco).

### 4. 🟡 Registrar treino é um botão "+1"

Sem prova, sem data, sem duração. Clica +1 e ganha 20 raios. O Gym Rats exige **foto de prova** — é o que dá legitimidade. Aqui é trivialmente "fraudável" e não há conceito real de sessão.

### 5. 🟡 Integração de saúde é só toggle

Apple Health / Google Fit são switches visuais sem nenhuma chamada de API. Aceitável para pitch acadêmico, desde que fique claro que é fachada.

---

## O que NÃO preocupa para o pitch acadêmico

- **Avatar 2D em vez de 3D** — o PRD pede 3D, mas a animação frame-a-frame comunica a ideia. Baixa prioridade.
- **Sem notificações push reais** — simulável no demo.

---

## Recomendação para máximo impacto no pitch

O essencial está pronto. O que ainda agrega:

1. **Seeding de contas demo** — sem membros na Bananeira, o loop social não fica demonstrável ao vivo. Único item urgente restante.
2. **Sprites dos estados intermediários** — só se houver arte disponível; filtro CSS já cobre o pitch.
