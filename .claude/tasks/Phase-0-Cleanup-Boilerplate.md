# Phase 0 : Cleanup Boilerplate + Setup Craftsmanship

**Durée :** 1-2 jours
**Statut :** 🟡 À faire
**Priorité :** CRITIQUE (avant toute feature)

---

## Objectif

Nettoyer la boilerplate, retirer le superflu, et mettre en place les fondations Clean Architecture + TDD.

---

## Tasks

### 1. Audit Boilerplate (1h)

- [ ] Lister tous les fichiers/dossiers présents
- [ ] Identifier ce qui est nécessaire pour DevFlow :
  - ✅ Auth (NextAuth)
  - ✅ Database (Prisma)
  - ✅ UI (shadcn/ui, Tailwind)
  - ✅ API routes
  - ❌ Features inutiles (blog, landing page, etc.)
  - ❌ Packages npm inutiles
  - ❌ Config surcharges

### 2. Cleanup Files (2h)

- [ ] Supprimer pages inutiles :
  ```bash
  # Exemples courants à virer
  rm -rf app/blog
  rm -rf app/docs
  rm -rf app/pricing
  rm -rf app/marketing
  rm -rf components/marketing
  rm -rf components/landing
  ```

- [ ] Supprimer components inutiles :
  ```bash
  rm -rf components/examples
  rm -rf components/demo
  ```

- [ ] Nettoyer public/ :
  ```bash
  # Garder uniquement :
  # - favicon.ico
  # - logo.png (DevFlow)
  # Virer le reste
  ```

### 3. Cleanup Dependencies (1h)

- [ ] Audit package.json
- [ ] Retirer packages inutiles :
  ```bash
  pnpm remove [package-non-utilise]
  ```

- [ ] Exemples courants à virer (selon boilerplate) :
  - Analytics tiers (Mixpanel, etc.) si pas utilisé
  - CMS (Contentful, Sanity) si pas utilisé
  - Payment libs (Stripe) si pas setup → on le fera nous-mêmes en Phase 9
  - Monitoring (Sentry) → on le fera en Phase 12

- [ ] Garder uniquement :
  ```json
  {
    "dependencies": {
      "next": "14.x",
      "react": "18.x",
      "next-auth": "^4.x",
      "@prisma/client": "^5.x",
      "tailwindcss": "^3.x",
      "lucide-react": "^0.x",
      "zod": "^3.x",
      "react-hook-form": "^7.x",
      "@tanstack/react-query": "^5.x" // si présent
    },
    "devDependencies": {
      "typescript": "^5.x",
      "prisma": "^5.x",
      "@types/node": "^20.x",
      "@types/react": "^18.x",
      "eslint": "^8.x",
      "prettier": "^3.x"
    }
  }
  ```

- [ ] Run `pnpm install` pour cleanup node_modules

### 4. Restructure Folders (Clean Architecture) (3h)

- [ ] Créer structure monorepo :
  ```bash
  mkdir -p packages/core/src/{domain,usecases,ports}
  mkdir -p packages/core/tests
  mkdir -p packages/api/src/{adapters,routes,actions}
  mkdir -p packages/api/tests
  mkdir -p packages/cli/src/{commands,utils}
  mkdir -p packages/cli/tests
  ```

- [ ] Si boilerplate pas monorepo, setup pnpm workspace :
  ```json
  // pnpm-workspace.yaml
  packages:
    - 'packages/*'
  ```

- [ ] Créer packages/core/package.json :
  ```json
  {
    "name": "@devflow/core",
    "version": "1.0.0",
    "main": "dist/index.js",
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
  }
  ```

- [ ] Créer packages/api/package.json :
  ```json
  {
    "name": "@devflow/api",
    "version": "1.0.0",
    "dependencies": {
      "@devflow/core": "workspace:*"
    }
  }
  ```

- [ ] Créer packages/cli/package.json :
  ```json
  {
    "name": "@devflow/cli",
    "version": "1.0.0",
    "bin": {
      "devflow": "./dist/index.js"
    },
    "dependencies": {
      "@devflow/core": "workspace:*"
    }
  }
  ```

- [ ] Move app/ → packages/web/ (si applicable)

### 5. Setup TDD (Jest + React Testing Library) (2h)

- [ ] Install Jest :
  ```bash
  pnpm add -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```

- [ ] Créer jest.config.js (root) :
  ```js
  module.exports = {
    projects: [
      '<rootDir>/packages/core',
      '<rootDir>/packages/api',
      '<rootDir>/packages/web',
      '<rootDir>/packages/cli',
    ],
  };
  ```

- [ ] Créer packages/core/jest.config.js :
  ```js
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };
  ```

- [ ] Créer packages/web/jest.config.js (React) :
  ```js
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/*.test.tsx', '**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };
  ```

- [ ] Créer packages/web/tests/setup.ts :
  ```ts
  import '@testing-library/jest-dom';
  ```

- [ ] Créer smoke test (packages/core/tests/smoke.test.ts) :
  ```ts
  describe('Smoke test', () => {
    it('should pass', () => {
      expect(true).toBe(true);
    });
  });
  ```

- [ ] Run tests :
  ```bash
  pnpm test
  ```

### 6. Setup ESLint + Prettier (1h)

- [ ] Cleanup .eslintrc.json :
  ```json
  {
    "extends": [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],
    "rules": {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
  ```

- [ ] Cleanup .prettierrc :
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100
  }
  ```

- [ ] Add scripts package.json (root) :
  ```json
  {
    "scripts": {
      "lint": "eslint . --ext .ts,.tsx",
      "lint:fix": "eslint . --ext .ts,.tsx --fix",
      "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
  }
  ```

### 7. Setup Husky (Pre-commit hooks) (1h)

- [ ] Install Husky :
  ```bash
  pnpm add -D husky lint-staged
  npx husky init
  ```

- [ ] Créer .husky/pre-commit :
  ```bash
  #!/bin/sh
  pnpm lint-staged
  pnpm test --passWithNoTests
  ```

- [ ] Add lint-staged config (package.json) :
  ```json
  {
    "lint-staged": {
      "*.{ts,tsx}": [
        "eslint --fix",
        "prettier --write"
      ],
      "*.{json,md}": [
        "prettier --write"
      ]
    }
  }
  ```

- [ ] Test pre-commit hook :
  ```bash
  git add .
  git commit -m "test: pre-commit hook"
  # Doit run lint + tests
  ```

### 8. Cleanup Prisma Schema (1h)

- [ ] Audit prisma/schema.prisma
- [ ] Retirer models inutiles (exemples de la boilerplate)
- [ ] Garder uniquement :
  ```prisma
  model User {
    id            String   @id @default(cuid())
    email         String   @unique
    passwordHash  String
    name          String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    @@map("users")
  }
  ```

- [ ] On ajoutera les autres models (Task, TimeBlock, etc.) dans Phase 2

- [ ] Reset DB :
  ```bash
  npx prisma migrate reset --force
  npx prisma migrate dev --name init
  ```

### 9. Cleanup Environment Variables (30min)

- [ ] Audit .env.example
- [ ] Garder uniquement nécessaire :
  ```
  # Database
  DATABASE_URL="postgresql://..."

  # NextAuth
  NEXTAUTH_SECRET="..."
  NEXTAUTH_URL="http://localhost:3000"

  # OpenAI (on l'ajoutera en Phase 3)
  # OPENAI_API_KEY="sk-..."
  ```

- [ ] Copier .env.example → .env
- [ ] Configurer DATABASE_URL (Neon)

### 10. Design System Cleanup (2h)

- [ ] Audit globals.css
- [ ] Retirer CSS inutile (animations fancy, gradients, etc.)
- [ ] Setup CSS variables brutal :
  ```css
  @layer base {
    :root {
      /* Colors */
      --background: 0 0% 100%;
      --foreground: 0 0% 5%;
      --border: 0 0% 0%; /* Black borders */

      /* Priorities */
      --sacred: 0 84% 60%; /* red-500 */
      --important: 25 95% 53%; /* orange-500 */
      --optional: 142 71% 45%; /* green-500 */
    }

    .dark {
      --background: 0 0% 5%;
      --foreground: 0 0% 98%;
    }
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', sans-serif;
  }
  ```

- [ ] Update tailwind.config.ts :
  ```ts
  export default {
    darkMode: 'class',
    content: [
      './packages/web/src/**/*.{ts,tsx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        colors: {
          border: 'hsl(var(--border))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          sacred: 'hsl(var(--sacred))',
          important: 'hsl(var(--important))',
          optional: 'hsl(var(--optional))',
        },
      },
    },
  };
  ```

### 11. README Cleanup (30min)

- [ ] Retirer contenu boilerplate
- [ ] Écrire README minimal :
  ```markdown
  # DevFlow

  > Productivity system for 10x developers

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

  ## Architecture

  - Clean Architecture + TDD
  - Monorepo (pnpm workspaces)
  - Next.js 14 + TypeScript + Prisma

  ## Commands

  - `pnpm dev` - Start dev server
  - `pnpm test` - Run tests
  - `pnpm lint` - Lint code
  - `pnpm format` - Format code
  ```

### 12. Git Cleanup (30min)

- [ ] Commit cleanup :
  ```bash
  git add .
  git commit -m "chore: cleanup boilerplate and setup craftsmanship

  - Remove unused pages, components, dependencies
  - Setup monorepo structure (Clean Architecture)
  - Setup TDD (Jest + RTL)
  - Setup ESLint + Prettier + Husky
  - Cleanup Prisma schema
  - Setup design system (brutal style)
  - Update README

  🤖 Generated with Claude Code
  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

- [ ] Create feature branch :
  ```bash
  git checkout -b feature/phase-1-design
  ```

---

## Critères de Succès

- [ ] Boilerplate nettoyée (fichiers inutiles supprimés)
- [ ] Monorepo structure créée (packages/core, api, web, cli)
- [ ] TDD setup (Jest + RTL, smoke test passe)
- [ ] ESLint + Prettier configurés
- [ ] Husky pre-commit hook actif
- [ ] Prisma schema minimal (User only)
- [ ] Design system brutal configuré
- [ ] README clean
- [ ] `pnpm dev` fonctionne
- [ ] `pnpm test` passe
- [ ] `pnpm lint` OK
- [ ] Git clean (commit initial)

---

## Checklist Software Craftsmanship

✅ **Clean Architecture**
- Domain / Use Cases / Adapters séparés
- Business logic isolée (packages/core)
- Testable sans framework

✅ **TDD**
- Jest configuré
- Coverage threshold 80%
- Tests run en pre-commit

✅ **Code Quality**
- ESLint strict
- Prettier auto-format
- No console.log (warn only)
- TypeScript strict mode

✅ **Git Hygiene**
- Commits clairs, atomiques
- Conventional commits
- Pre-commit hooks

✅ **Documentation**
- README à jour
- Code commenté si nécessaire (clean code = self-documented)

---

## Prochaine phase

Phase 1 : Validation & Design (Wireframes, User Flows, Design System)
