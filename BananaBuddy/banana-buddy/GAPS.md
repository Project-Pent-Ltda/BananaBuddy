# Análise de Gaps — Banana Buddy

Diagnóstico honesto do protótipo atual comparado à tese do produto: **"Gym Rats, mas gamificado"** — um app de fitness social (feed + ranking + prova de treino) com um avatar-banana que reflete emocionalmente o esforço do usuário.

Documento de backlog priorizado. Atualizado em 2026-06-15.

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
| Moods da banana | 🟡 Mock | happy/on-fire/dead/zen — toggle manual, sem tempo |
| Bananeiras (social) | ✅ Real | Criar/entrar por código, ranking real (soma de sessões), cutucar |
| Registro de treino | 🔴 Raso | Botão "+1" → +20 raios, sem data/duração/prova |
| Integração de saúde | 🔴 Fachada | Toggles Apple/Google sem nenhuma chamada de API |
| Streak | ❌ Ausente | Texto "5" hardcoded no mapa, sem lógica |

---

## Fraquezas em ordem de impacto

### 1. ✅ O loop social — ENDEREÇADO (2026-06-15)
As Bananeiras agora são reais, backed por Supabase: criar/entrar por código (RPC `create_bananeira`/`join_bananeira`), membros e ranking computados de verdade (`bananeira_overview`, `bananeira_members` × `profiles`), e "Cutucar" via tabela `pokes` com checagem de não-vistos no dashboard. Sem real-time — atualização por refresh manual (decisão do usuário). Ver `db/bananeiras.sql` e `lib/bananeiras.ts`.

Mapa com fundo pixel art, pódio/destaque do líder, esporte principal e badge de fundador por membro, registro de treino direto do mapa (2026-06-16).

**Pendente (gaps secundários, não bloqueiam o pitch):**
- **Seeding de contas demo** — Bananeira de demonstração com 2-3 membros e `practiced_sports` preenchido, pra não começar com ranking zerado.
- **Utilidade real da cutucada** — hoje é só um toast social, sem efeito de jogo (não dá raios, não afeta streak/On Fire, sem limite diário). Avaliar dar peso à mecânica (ex.: pequeno bônus a quem cutuca, ou penalidade por ignorar).

### 2. 🔴 A banana não apodrece de verdade
O gancho emocional inteiro — "se você sumir, sua banana apodrece" — **não funciona** (`App.tsx:421`):
- O estado é um toggle manual (`setIsOnFire`), não há lógica de data, streak nem decaimento.
- Só existe o estado `dead`; faltam os intermediários (Amadurecendo, Quase Podre) que o PRD define.
- Sem tempo, a banana não tem **stakes** — e stakes é o que vende o conceito no pitch.

### 3. 🔴 Não existe streak
Zero contador de dias seguidos, zero escudos, zero marcos (`App.tsx:834-840`). Streak é metade da mecânica de gamificação descrita no PRD e simplesmente não existe.

### 4. 🟡 Registrar treino é um botão "+1"
Sem prova, sem data, sem duração. Clica +1 e ganha 20 raios. O Gym Rats exige **foto de prova** — é o que dá legitimidade. Aqui é trivialmente "fraudável" e não há conceito real de sessão.

### 5. 🟡 Integração de saúde é só toggle
Apple Health / Google Fit são switches visuais sem nenhuma chamada de API (`App.tsx:267-315`). Aceitável para pitch acadêmico, desde que fique claro que é fachada.

---

## O que NÃO preocupa para o pitch acadêmico

- **Avatar 2D em vez de 3D** — o PRD pede 3D, mas a animação frame-a-frame comunica a ideia. Baixa prioridade.
- **Sem notificações push reais** — simulável no demo.

---

## Recomendação para máximo impacto no pitch

As duas alavancas de maior retorno, ambas demonstráveis e de escopo contido:

1. **Streak + decaimento real** — tornar a banana apodrecer/melhorar com base em tempo e dias seguidos. Alto impacto visual, escopo de ~1 tela, fortalece o gancho emocional.
2. **Um loop social real** — pelo menos um ranking computado de verdade dentro de uma Bananeira (mesmo com membros semeados), para a tese de pressão social deixar de ser fachada.
