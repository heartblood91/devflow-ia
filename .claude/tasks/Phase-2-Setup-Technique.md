# Phase 2 : Setup Technique

**Durée :** Semaine 2 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Créer architecture Clean Architecture
- [ ] Setup Prisma + Neon (PostgreSQL)
- [ ] Setup TDD (Jest + React Testing Library)
- [ ] Setup CI/CD (GitHub Actions)

---

## Tasks

### 2.1 Architecture Monorepo

**Durée estimée :** 4h

- [ ] Créer structure de dossiers :

```
devflow/
├── packages/
│   ├── core/              # Business logic (domain)
│   │   ├── src/
│   │   │   ├── domain/    # Entities
│   │   │   ├── usecases/  # Use cases
│   │   │   └── ports/     # Interfaces
│   │   ├── tests/
│   │   └── package.json
│   ├── api/               # Next.js API + Server Actions
│   │   ├── src/
│   │   │   ├── adapters/  # DB adapters
│   │   │   ├── routes/    # API routes
│   │   │   └── actions/   # Server Actions
│   │   ├── tests/
│   │   └── package.json
│   ├── web/               # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/       # App Router
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── tests/
│   │   └── package.json
│   └── cli/               # Node.js CLI
│       ├── src/
│       │   ├── commands/
│       │   ├── utils/
│       │   └── index.ts
│       ├── tests/
│       └── package.json
├── .claude/
│   ├── tasks/             # EPCT tasks
│   └── workspace/         # Task creator prompts
├── docs/
├── package.json           # Root workspace
├── turbo.json             # Turborepo config
└── tsconfig.base.json     # Shared TypeScript config
```

- [ ] Initialiser Turborepo ou pnpm workspace
- [ ] Créer tsconfig.base.json partagé
- [ ] Créer .gitignore
- [ ] Créer README.md

**Outils :**
- Turborepo (monorepo management)
- pnpm (package manager, plus rapide que npm)

---

### 2.2 Setup Prisma + Neon

**Durée estimée :** 4h

#### Étape 1 : Créer compte Neon

- [ ] Créer compte sur neon.tech
- [ ] Créer database "devflow-dev"
- [ ] Récupérer connection string (DATABASE_URL)

#### Étape 2 : Setup Prisma

- [ ] Installer Prisma dans packages/api :
  ```bash
  cd packages/api
  pnpm add -D prisma
  pnpm add @prisma/client
  ```

- [ ] Initialiser Prisma :
  ```bash
  npx prisma init
  ```

- [ ] Créer schema Prisma (prisma/schema.prisma) :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  passwordHash      String
  name              String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  preferences       Json     // { chronotype, workHours, warRoomSchedule, etc. }

  tasks             Task[]
  recurringTasks    RecurringTask[]
  timeBlocks        TimeBlock[]
  dailyReflections  DailyReflection[]

  @@map("users")
}

model Task {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title             String
  description       String?
  priority          Priority @default(optional)
  difficulty        Int      @default(3) // 1-5
  estimatedDuration Int      // minutes
  status            Status   @default(inbox)
  kanbanColumn      KanbanColumn @default(inbox)

  deadline          DateTime?
  quarter           String?  // "Q1-2026", "Q2-2026", etc.

  parentTaskId      String?
  parentTask        Task?    @relation("TaskSubtasks", fields: [parentTaskId], references: [id])
  subtasks          Task[]   @relation("TaskSubtasks")

  dependencies      String[] // Array of task IDs

  weekSkippedCount  Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?

  @@index([userId, status])
  @@index([userId, priority])
  @@map("tasks")
}

model RecurringTask {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title                 String
  description           String?
  frequency             Frequency // daily, weekly, monthly
  daysOfWeek            Int[]    // [1,2,3,4,5] = lun-ven
  estimatedDuration     Int      // minutes

  escalationEnabled     Boolean  @default(false)
  escalationAfterSkips  Int      @default(4)
  escalationPriority    Priority @default(important)
  escalationDay         String   @default("friday") // "friday", "last_working_day"

  skippedCount          Int      @default(0)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([userId])
  @@map("recurring_tasks")
}

model TimeBlock {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  date              DateTime
  startTime         String   // "09:00"
  endTime           String   // "11:00"

  type              BlockType @default(deep_work)
  priority          Priority?

  taskId            String?
  taskTitle         String?

  isFree            Boolean  @default(false)
  isRescue          Boolean  @default(false)
  rescueReason      String?

  suggestedTasks    String[] // Array of task IDs

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId, date])
  @@map("time_blocks")
}

model DailyReflection {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  date              DateTime @unique

  completedTasks    Int      @default(0)
  totalTasks        Int      @default(0)
  focusQuality      Int      @default(0) // 1-5
  energyLevel       Int      @default(0) // 1-5

  wins              String[] // ["Terminé SEPA", "Aucune interruption"]
  struggles         String[] // ["Trop de réunions"]
  insights          String?  // AI-generated insights

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId, date])
  @@map("daily_reflections")
}

enum Priority {
  sacred
  important
  optional
}

enum Status {
  inbox
  todo
  doing
  done
}

enum KanbanColumn {
  inbox
  todo
  doing
  done
}

enum BlockType {
  deep_work
  shallow_work
  admin
  break
  meeting
  buffer
  rescue
}

enum Frequency {
  daily
  weekly
  monthly
}
```

- [ ] Créer .env :
  ```
  DATABASE_URL="postgresql://..."
  ```

- [ ] Générer migration :
  ```bash
  npx prisma migrate dev --name init
  ```

- [ ] Générer Prisma Client :
  ```bash
  npx prisma generate
  ```

**Critères de validation :**
- Migration appliquée sur Neon
- Prisma Client généré
- Connexion testée (npx prisma studio)

---

### 2.3 Setup TDD (Jest + RTL)

**Durée estimée :** 4h

#### packages/core (Business Logic)

- [ ] Installer Jest :
  ```bash
  cd packages/core
  pnpm add -D jest @types/jest ts-jest
  ```

- [ ] Créer jest.config.js :
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

- [ ] Créer script dans package.json :
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
  }
  ```

- [ ] Créer premier test (smoke test) :
  ```ts
  // tests/domain/Task.test.ts
  describe('Task Entity', () => {
    it('should create a task', () => {
      expect(true).toBe(true);
    });
  });
  ```

#### packages/web (React Components)

- [ ] Installer React Testing Library :
  ```bash
  cd packages/web
  pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```

- [ ] Créer jest.config.js (React)
- [ ] Créer tests/setup.ts avec setupFilesAfterEnv

#### packages/api (Server Actions)

- [ ] Même config que core
- [ ] Ajouter msw (Mock Service Worker) pour mock API

**Critères de validation :**
- `pnpm test` fonctionne dans chaque package
- Coverage reports générés
- Pre-commit hook (Husky) exécute tests

---

### 2.4 Setup CI/CD (GitHub Actions)

**Durée estimée :** 3h

#### Étape 1 : Créer repo GitHub

- [ ] Créer repo "devflow" (private)
- [ ] Ajouter .gitignore (node_modules, .env, .next, etc.)
- [ ] Push initial commit

#### Étape 2 : Setup GitHub Actions

- [ ] Créer `.github/workflows/ci.yml` :

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Run tests
        run: pnpm test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

- [ ] Ajouter secrets GitHub :
  - `DATABASE_URL` (Neon connection string)
  - `CODECOV_TOKEN` (si coverage tracking)

#### Étape 3 : Setup Husky (Pre-commit hooks)

- [ ] Installer Husky :
  ```bash
  pnpm add -D husky lint-staged
  npx husky init
  ```

- [ ] Créer `.husky/pre-commit` :
  ```bash
  #!/bin/sh
  pnpm lint-staged
  pnpm test
  ```

- [ ] Ajouter lint-staged dans package.json :
  ```json
  {
    "lint-staged": {
      "*.{ts,tsx}": [
        "eslint --fix",
        "prettier --write"
      ]
    }
  }
  ```

**Critères de validation :**
- Push déclenche CI
- Tests passent
- Build réussit
- Pre-commit hook bloque si tests échouent

---

### 2.5 Setup Vercel (Deployment)

**Durée estimée :** 2h

- [ ] Créer compte Vercel
- [ ] Connecter repo GitHub "devflow"
- [ ] Configurer variables d'environnement :
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET` (généré via `openssl rand -base64 32`)
  - `NEXTAUTH_URL` (https://devflow.vercel.app)
- [ ] Déployer branche main → Production
- [ ] Configurer preview deployments (branches develop, feature/*)

**Critères de validation :**
- App déployée sur Vercel
- Prisma migrations s'exécutent automatiquement
- Preview URLs générées pour chaque PR

---

## Critères de Succès

- [ ] Monorepo créé avec architecture Clean
- [ ] Prisma connecté à Neon
- [ ] Tests unitaires configurés (80% coverage target)
- [ ] CI/CD fonctionnel (GitHub Actions)
- [ ] Deployment Vercel configuré
- [ ] Documentation technique (README.md)
- [ ] Prêt pour Phase 3 (Auth + Onboarding)

---

## Risques

**Risque 1 : Complexité monorepo**
- **Impact :** Perte de temps sur setup
- **Mitigation :** Utiliser Turborepo (déjà testé, stable)

**Risque 2 : Prisma migrations en production**
- **Impact :** Downtime si migration échoue
- **Mitigation :** Toujours tester migrations sur staging DB

**Risque 3 : Tests trop longs (CI lent)**
- **Impact :** Dev experience dégradée
- **Mitigation :** Paralléliser tests, utiliser cache pnpm

---

## Notes

- Ne pas overengineering le setup
- Focus sur MVP, itérer après
- Documentation technique minimum (README + comments)

---

**Prochaine phase :** Phase 3 - Auth + Onboarding
