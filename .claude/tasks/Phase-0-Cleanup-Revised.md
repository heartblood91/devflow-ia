# Phase 0 : Cleanup Boilerplate + Setup DevFlow

**Durée :** 1-2 jours
**Statut :** 🟡 À faire
**Priorité :** CRITIQUE (avant toute feature)

---

## Objectif

Nettoyer la boilerplate Next.js 15, retirer le superflu (multi-tenant, marketing), et préparer la structure pour DevFlow.

---

## Architecture Confirmée

**✅ ON GARDE :**
- Next.js 15 (App Router) - monolith, pas de monorepo
- Better Auth (moderne, meilleur que NextAuth)
- Vitest + Playwright (déjà configuré)
- Prisma + Neon
- shadcn/ui + Tailwind
- Email system (utile pour notifications)

**❌ ON RETIRE :**
- Features multi-tenant / organizations
- Pages marketing / landing page
- Stripe billing (on le fera simple en Phase 9)
- Components/pages inutiles pour DevFlow

**📁 Structure DevFlow (simple) :**
```
app/                    # Next.js App Router
  ├── (auth)/          # Auth pages
  ├── dashboard/       # Dashboard quotidien
  ├── backlog/         # Kanban tasks
  ├── weekly/          # Planning hebdo + War Room
  ├── settings/        # User settings
  └── api/             # API routes

lib/
  ├── actions/         # Server Actions (business logic)
  ├── ai/              # DevFlow AI (prompts, context, proactive)
  ├── stats/           # Calculs stats/insights
  ├── auth/            # Better Auth config
  ├── db/              # Prisma client
  └── utils/           # Helpers

components/
  ├── ui/              # shadcn/ui components
  ├── dashboard/       # Dashboard components
  ├── backlog/         # Backlog components
  ├── weekly/          # Weekly view components
  ├── timer/           # Timer + Focus Mode
  └── chatbot/         # DevFlow AI chatbot

cli/                   # DevFlow CLI (séparé, simple npm package)
  ├── src/
  │   ├── commands/
  │   └── index.ts
  └── package.json

prisma/
  └── schema.prisma    # Database schema
```

---

## Tasks

### 1. Audit Boilerplate Actuel (1h)

- [ ] Lire structure complète :
  ```bash
  tree -L 3 -I 'node_modules|.next|dist'
  ```

- [ ] Identifier fichiers/dossiers à supprimer :
  - Features multi-tenant (organizations, teams, invites)
  - Pages marketing (landing, pricing, docs, blog)
  - Components marketing/landing
  - API routes inutiles
  - Stripe setup (on le fera nous-mêmes)

- [ ] Lister dans un fichier `CLEANUP.md` :
  ```markdown
  # To Delete
  - app/organizations/
  - app/marketing/
  - app/pricing/
  - components/marketing/
  - lib/stripe/ (sauf si vraiment minimal)
  - ...
  ```

### 2. Cleanup Files (2h)

- [ ] Supprimer dossiers inutiles :
  ```bash
  # Exemples (adapter selon ton audit)
  rm -rf app/organizations
  rm -rf app/marketing
  rm -rf app/pricing
  rm -rf app/blog
  rm -rf app/docs
  rm -rf components/marketing
  rm -rf components/landing
  ```

- [ ] Supprimer pages auth inutiles (garder uniquement login/signup) :
  ```bash
  # Si tu as forgot-password, verify-email, etc. et pas besoin
  # les garder si tu en as besoin
  ```

- [ ] Nettoyer `public/` :
  ```bash
  # Garder uniquement :
  # - favicon.ico
  # - logo.png (à remplacer par logo DevFlow)
  # Virer le reste
  ```

### 3. Cleanup Dependencies (1h)

- [ ] Audit `package.json`
- [ ] Retirer packages inutiles :
  ```bash
  # Exemples courants (selon ta boilerplate)
  pnpm remove @stripe/stripe-js  # si pas utilisé (on le fera Phase 9)
  pnpm remove mixpanel-browser   # analytics tiers
  pnpm remove @vercel/analytics  # si pas utilisé
  # ... autres packages inutiles
  ```

- [ ] Vérifier dependencies essentielles présentes :
  ```json
  {
    "dependencies": {
      "next": "^15.x",
      "react": "^19.x",
      "better-auth": "^1.x",
      "@prisma/client": "^5.x",
      "tailwindcss": "^3.x",
      "lucide-react": "latest",
      "zod": "^3.x",
      "react-hook-form": "^7.x",
      "date-fns": "^3.x",
      "sonner": "^1.x"  // pour toasts
    },
    "devDependencies": {
      "typescript": "^5.x",
      "prisma": "^5.x",
      "vitest": "^2.x",
      "playwright": "^1.x",
      "eslint": "^9.x",
      "prettier": "^3.x"
    }
  }
  ```

- [ ] Ajouter si manquant :
  ```bash
  pnpm add openai  # Pour DevFlow AI
  pnpm add @dnd-kit/core @dnd-kit/sortable  # Pour drag & drop
  pnpm add recharts  # Pour stats graphiques
  ```

- [ ] Run cleanup :
  ```bash
  pnpm install
  ```

### 4. Cleanup Prisma Schema (1h)

- [ ] Ouvrir `prisma/schema.prisma`
- [ ] Supprimer models multi-tenant :
  ```prisma
  // SUPPRIMER (exemples) :
  model Organization { }
  model Team { }
  model Invite { }
  model Subscription { }  // On le fera simple en Phase 9
  ```

- [ ] Garder uniquement User minimal :
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }

  model User {
    id            String   @id @default(cuid())
    email         String   @unique
    name          String?
    image         String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Better Auth fields (garder ceux nécessaires)
    emailVerified Boolean  @default(false)

    // DevFlow preferences (JSON pour flexibilité MVP)
    preferences   Json?    @default("{}")

    @@map("users")
  }

  // On ajoutera Task, TimeBlock, etc. en Phase 2
  ```

- [ ] Reset DB :
  ```bash
  npx prisma migrate reset --force
  npx prisma migrate dev --name init-devflow
  npx prisma generate
  ```

### 5. Setup DevFlow Folders (1h)

- [ ] Créer structure :
  ```bash
  mkdir -p lib/actions
  mkdir -p lib/ai
  mkdir -p lib/stats
  mkdir -p components/dashboard
  mkdir -p components/backlog
  mkdir -p components/weekly
  mkdir -p components/timer
  mkdir -p components/chatbot
  mkdir -p cli/src/commands
  ```

- [ ] Créer placeholders :
  ```bash
  # lib/actions/tasks.ts (placeholder)
  touch lib/actions/tasks.ts

  # lib/ai/context.ts (placeholder)
  touch lib/ai/context.ts

  # lib/stats/calculate.ts (placeholder)
  touch lib/stats/calculate.ts
  ```

### 6. Setup Craftsmanship Conventions (1h)

#### ESLint

- [ ] Vérifier que ESLint fonctionne :
  ```bash
  pnpm lint
  ```

#### Prettier

- [ ] Vérifier que Prettier fonctionne :
  ```bash
  pnpm format
  ```

#### Git Commit Conventions

- [ ] Ajouter conventions de commit dans `CLAUDE.md` :
  - Format: Conventional Commits
  - Types autorisés: feat, fix, chore, docs, refactor, test, style
  - Exemples de bons commits
  - Interdiction de commit sans review
  - Pas de Husky - responsabilité du développeur

**Note:** Pas de Husky. On préfère la responsabilité individuelle aux hooks automatiques.

### 7. Design System ⏭️ SKIPPED

**Decision:** Pas de design system custom pour le MVP. On utilise Tailwind standard + shadcn/ui.

**Raison:** Le design system custom ralentit le développement MVP. Les couleurs de priorité (sacred/important/optional) seront gérées directement avec Tailwind (red-500, orange-500, blue-500) dans les composants.

### 8. Setup Vitest (Smoke Test) (1h)

- [ ] Vérifier `vitest.config.ts` existe et configuré
- [ ] Si manquant, créer :
  ```ts
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  });
  ```

- [ ] Créer `tests/setup.ts` :
  ```ts
  import { expect, afterEach } from 'vitest';
  import { cleanup } from '@testing-library/react';
  import * as matchers from '@testing-library/jest-dom/matchers';

  expect.extend(matchers);

  afterEach(() => {
    cleanup();
  });
  ```

- [ ] Créer smoke test `tests/smoke.test.ts` :
  ```ts
  import { describe, it, expect } from 'vitest';

  describe('Smoke test', () => {
    it('should pass', () => {
      expect(true).toBe(true);
    });
  });
  ```

- [ ] Run tests :
  ```bash
  pnpm test:ci
  # Devrait passer ✅
  ```

### 9. Environment Variables (30min)

- [ ] Audit `.env.example`
- [ ] Garder uniquement nécessaire :
  ```
  # Database
  DATABASE_URL="postgresql://..."

  # Better Auth
  BETTER_AUTH_SECRET="..."
  BETTER_AUTH_URL="http://localhost:3000"

  # Email (Resend ou autre)
  RESEND_API_KEY="..."

  # OpenAI (Phase 3+)
  # OPENAI_API_KEY="sk-..."

  # Cron secret (Phase 8+)
  # CRON_SECRET="..."
  ```

- [ ] Copier vers `.env` :
  ```bash
  cp .env.example .env
  # Configurer les vraies valeurs
  ```

### 10. README Cleanup (30min)

- [ ] Retirer contenu boilerplate
- [ ] Écrire README DevFlow minimal :
  ```markdown
  # DevFlow

  > Productivity system for 10x developers

  ## What is DevFlow?

  DevFlow is a productivity app that aggregates scientifically validated concepts:
  - Time-blocking with chronotype optimization
  - Weekly War Room (planning)
  - Daily Reflection with AI insights
  - Timer (Pomodoro / Ultradian)
  - DevFlow AI (proactive assistant)
  - DevFlow CLI (rapid task import)

  ## Tech Stack

  - Next.js 15 (App Router)
  - Better Auth
  - Prisma + Neon (PostgreSQL)
  - shadcn/ui + Tailwind CSS
  - OpenAI GPT-4o-mini
  - Vitest + Playwright

  ## Setup

  1. Install dependencies:
     \`\`\`bash
     pnpm install
     \`\`\`

  2. Setup database:
     \`\`\`bash
     cp .env.example .env
     # Configure DATABASE_URL in .env
     npx prisma migrate dev
     \`\`\`

  3. Run dev server:
     \`\`\`bash
     pnpm dev
     \`\`\`

  ## Development

  - `pnpm dev` - Start dev server (Turbo)
  - `pnpm test` - Run tests (watch mode)
  - `pnpm test:ci` - Run tests (CI mode)
  - `pnpm lint` - Lint code
  - `pnpm format` - Format code
  - `pnpm type-check` - TypeScript check

  ## Architecture

  Simple Next.js monolith with clean separation:
  - `app/` - Next.js App Router
  - `lib/actions/` - Server Actions (business logic)
  - `lib/ai/` - DevFlow AI
  - `components/` - React components
  - `cli/` - DevFlow CLI

  ## License

  MIT
  ```

### 11. Git Cleanup (1h)

- [ ] Vérifier `.gitignore` :
  ```
  # dependencies
  node_modules
  .pnpm-store

  # next.js
  .next
  out
  build

  # testing
  coverage
  .vitest
  playwright-report
  test-results

  # env
  .env
  .env*.local

  # misc
  .DS_Store
  *.log

  # prisma
  prisma/migrations/*_init  # si tu veux pas commit migrations initiales
  ```

- [ ] Commit cleanup :
  ```bash
  git add .
  git commit -m "chore: complete Phase 0 cleanup for DevFlow

  - Setup DevFlow folder structure (lib/actions, lib/ai, components/*)
  - Add git commit conventions to CLAUDE.md
  - Cleanup .env-template (remove Stripe)
  - Update README for DevFlow"
  ```

- [ ] Create feature branch :
  ```bash
  git checkout -b feature/phase-1-design
  ```

---

## Critères de Succès

- [ ] Features multi-tenant supprimées
- [ ] Pages marketing supprimées
- [ ] Dependencies nettoyées
- [ ] DevFlow folders créés (`lib/actions`, `lib/ai`, etc.)
- [ ] Git commit conventions ajoutées dans CLAUDE.md
- [ ] Prisma schema minimal (User only)
- [ ] Vitest smoke test passe ✅
- [ ] `pnpm dev` fonctionne
- [ ] `pnpm test:ci` passe
- [ ] `pnpm lint` OK
- [ ] README DevFlow à jour
- [ ] Git clean (commit cleanup)
- [ ] .env-template nettoyé (Stripe supprimé)

---

## Checklist Software Craftsmanship

✅ **Architecture Simple**
- Next.js 15 monolith (pas de monorepo over-engineering)
- Séparation logique (actions, ai, components)
- Testable

✅ **Testing**
- Vitest configuré
- Playwright configuré
- Smoke test passe
- Tests à lancer manuellement (pnpm test:ci)

✅ **Code Quality**
- ESLint strict
- Prettier auto-format
- No console.log (warn only)
- TypeScript strict mode

✅ **Git Hygiene**
- Commits clairs, atomiques
- Conventional commits (dans CLAUDE.md)
- Pas de pre-commit hooks (responsabilité développeur)

✅ **Documentation**
- README DevFlow
- Code commenté si nécessaire

---

## Prochaine phase

Phase 1 : Validation & Design (Wireframes, User Flows, Design System)
