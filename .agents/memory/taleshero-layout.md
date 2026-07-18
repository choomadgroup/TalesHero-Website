---
name: Tales Hero project layout
description: How the workspace is structured — critical to avoid re-adding wrong folders
---

The root of the repo IS the pnpm workspace package named `@workspace/taleshero`.
`client/` is just a source directory holding `src/` — it is NOT a separate workspace package.

**Why:** The user does not want extra folders or nested packages. The original Vercel import already placed config files at root (package.json, vite.config.ts, index.html, tsconfig.json).

**How to apply:**
- Never add `- client` to `packages:` in pnpm-workspace.yaml
- Never create `client/package.json`, `client/vite.config.ts`, etc.
- The workflow `client: web` runs `pnpm --include-workspace-root --filter @workspace/taleshero run dev` which executes the root `dev` script
- Vite root = repo root; entry = `./client/src/Main.tsx`; `@/*` alias = `./client/src/*`
- API routes live as Vite middleware in `vite.config.ts` (inline, no separate server)
- `public/` at repo root serves static assets (favicon.png, Image/tales-hero-banner.png)
- `.replit-artifact` is in `.gitignore` so it doesn't appear on GitHub
