# CLAUDE.md — Banana Buddy

Memória de trabalho do projeto. Descreve **o que existe no código**. (O `README.md` na raiz é apenas a visão/pitch do produto — não reflete o que está implementado e não deve ser usado como referência técnica.)

## O que é
Protótipo de UI (front-end only) de um app de fitness gamificado. Um avatar de banana reflete o esforço físico do usuário, que ganha "raios" (moeda), desbloqueia skins por conquista ou compra, entra em "clãs" (Bananeiras) e fica "On Fire" ao bater metas. Projeto acadêmico (Ibmec 2026.1), apresentado em formato de pitch.

Estado atual: **só front-end, sem backend.** Sem banco de dados, autenticação, rotas, GPS ou integração de saúde reais — tudo isso é mockado/visual.

## Stack
- Vite 6 + React 19 + TypeScript
- Tailwind CSS v4 + componentes shadcn/ui (base-ui / Radix)
- `motion` (Framer Motion) para animação, `lucide-react` para ícones
- Nasceu de um template do Google AI Studio. `@google/genai` e `express` estão no `package.json` mas **não são usados** no código.

## Estrutura
A raiz do repo (`/Users/bernardo/BananaBuddy`) tem o app aninhado em `BananaBuddy/banana-buddy/`. Trabalhe a partir de lá.

- `src/App.tsx` — **arquivo único** com quase toda a lógica (~790 linhas): todas as telas, o avatar e o estado global.
- `src/main.tsx`, `src/index.css` — entrypoint e tema (Tailwind v4 `@theme`).
- `components/ui/` — componentes shadcn (button, card, input, switch, badge, avatar, scroll-area, tabs).
- `public/` — PNGs do avatar: `banana.png` (base) e `banana_<skin>_<frame>.png` (skins, 4 frames cada).
- `lib/utils.ts` — helper `cn()`.

## Como funciona
- **Navegação:** máquina de estados com `useState<Screen>` em `App.tsx`. 8 telas: `splash → login → health → onboarding → dashboard → customization → bananeira-selection → bananeira-map → achievements`. Renderizadas dentro de um mockup de celular centralizado, com painéis laterais de showcase.
- **Avatar (`BananaIcon`):** animação 2D quadro-a-quadro trocando PNGs (não é 3D). 9 skins (base, ballet, boxe, cycle, judo, run, soccer, swim, yoga) e moods (happy, on-fire, dead, zen).
- **Estado:** tudo em memória no `App`, sem persistência. `raios` (moeda, +20 por progresso), `practicedSports` (progresso por esporte), `activeSkin`, `unlockedStoreSkins`, `isOnFire`.
- **Skins:** desbloqueadas por conquista (atingir a meta do esporte) ou compradas na loja com raios.

## Convenções
- Cor de marca: amarelo banana `#FFE135` (classes `bg-banana`, `text-banana`, etc., definidas no `@theme` do `index.css`).
- Fontes: Montserrat (`font-display`) e Inter/Geist (`font-sans`).
- Alias de import `@` aponta para a raiz de `banana-buddy/` (ex.: `@/components/ui/button`).
- UI dark (fundo preto), textos e comentários em português.

## Rodar
```
cd BananaBuddy/banana-buddy
npm install
npm run dev      # Vite na porta 3000
npm run lint     # tsc --noEmit
npm run build
```
