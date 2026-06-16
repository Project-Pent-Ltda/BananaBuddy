<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🍌 Banana Buddy

Protótipo de UI de um app de fitness gamificado: um avatar de banana reflete o
esforço físico do usuário, que ganha "raios", desbloqueia skins, entra em clãs
(Bananeiras) e fica "On Fire" ao bater metas. Projeto acadêmico (Ibmec 2026.1).

**Stack:** Vite 6 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui, com
Supabase para autenticação e dados das Bananeiras.

> Para a visão/pitch completo do produto, veja o [README da raiz](../../README.md).
> Para detalhes técnicos do que está implementado, veja [`../../CLAUDE.md`](../../CLAUDE.md).

## Rodar localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```
   npm install
   ```
2. Crie um arquivo `.env` (baseado no [`.env.example`](.env.example)) com as
   credenciais do Supabase:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Rode o app:
   ```
   npm run dev
   ```
   O Vite sobe na porta **3000**.

## Outros comandos

```
npm run build    # build de produção (gera dist/)
npm run lint     # checagem de tipos (tsc --noEmit)
npm run preview  # serve o build de produção localmente
```
