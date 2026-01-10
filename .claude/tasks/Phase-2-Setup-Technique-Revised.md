# Phase 2 : Setup Technique (Revised)

**Durée :** Semaine 2 (3-4 jours)
**Statut :** 🟡 À faire
**Dépendances :** Phase 0 (Cleanup) + Phase 1 (Design)

---

## Objectifs

- [ ] Ajouter models Prisma (Task, TimeBlock, etc.)
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Vérifier Vitest coverage (80% target)
- [ ] Setup Vercel deployment

---

## ⚠️ Ce qu'on NE fait PAS

- ❌ Pas de monorepo (déjà décidé : monolith Next.js 15)
- ❌ Pas de Jest (on garde Vitest)
- ❌ Pas de NextAuth setup (on garde Better Auth)
- ❌ Pas de Turborepo

---

## Tasks

### 2.1 Prisma Schema Complet (3h)

**Phase 0 a créé User minimal. Maintenant on ajoute tous les models DevFlow.**

- [ ] Ouvrir `prisma/schema.prisma`
- [ ] Ajouter models complets :

```prisma
// User existe déjà (Phase 0), on ajoute les relations

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

  timeBlocks        TimeBlock[]

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
  task              Task?    @relation(fields: [taskId], references: [id])
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

  date              DateTime

  completedTasks    Int      @default(0)
  totalTasks        Int      @default(0)
  focusQuality      Int      @default(0) // 1-5
  energyLevel       Int      @default(0) // 1-5

  wins              String[] // ["Terminé SEPA", "Aucune interruption"]
  struggles         String[] // ["Trop de réunions"]
  insights          String?  // AI-generated insights

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([userId, date])
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

- [ ] Ajouter relations au model User (déjà existant) :
  ```prisma
  model User {
    // ... champs existants (Phase 0)

    tasks             Task[]
    recurringTasks    RecurringTask[]
    timeBlocks        TimeBlock[]
    dailyReflections  DailyReflection[]
  }
  ```

- [ ] Générer migration :
  ```bash
  npx prisma migrate dev --name add-devflow-models
  ```

- [ ] Vérifier avec Prisma Studio :
  ```bash
  npx prisma studio
  ```

**Critères de validation :**
- [ ] Migration appliquée sur Neon
- [ ] Tous les models créés
- [ ] Relations fonctionnelles
- [ ] Prisma Studio affiche les tables

---

### 2.2 Vitest Coverage Configuration (1h)

**Vitest est déjà configuré (Phase 0). On vérifie juste le coverage target.**

- [ ] Vérifier `vitest.config.ts` a coverage configuré :
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
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.config.*',
          '**/.*',
          'dist/',
          '.next/',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  });
  ```

- [ ] Si manquant, installer coverage :
  ```bash
  pnpm add -D @vitest/coverage-v8
  ```

- [ ] Add script `package.json` :
  ```json
  {
    "scripts": {
      "test:coverage": "vitest run --coverage"
    }
  }
  ```

- [ ] Run coverage (devrait être à 100% pour l'instant, smoke test only) :
  ```bash
  pnpm test:coverage
  ```

---

### 2.3 CI/CD GitHub Actions (2h)

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
          version: 9

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
        run: pnpm test:ci

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

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
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          BETTER_AUTH_URL: "https://devflow.vercel.app"

  e2e:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e
```

- [ ] Ajouter secrets GitHub :
  - `DATABASE_URL` (Neon)
  - `BETTER_AUTH_SECRET`
  - `CODECOV_TOKEN` (optionnel)

**Critères de validation :**
- [ ] Push déclenche CI
- [ ] Lint passe
- [ ] Type check passe
- [ ] Tests passent
- [ ] Build réussit

---

### 2.4 Vercel Deployment (2h)

- [ ] Créer compte Vercel (si pas déjà fait)
- [ ] Connecter repo GitHub "devflow"
- [ ] Configurer variables d'environnement Vercel :
  - `DATABASE_URL` (Neon production)
  - `BETTER_AUTH_SECRET` (généré via `openssl rand -base64 32`)
  - `BETTER_AUTH_URL` (https://devflow.vercel.app)
  - `RESEND_API_KEY` (si email)

- [ ] Configurer build settings :
  - Framework Preset: Next.js
  - Build Command: `pnpm build`
  - Output Directory: `.next`
  - Install Command: `pnpm install`

- [ ] Configurer Prisma generation (Vercel fait automatiquement)

- [ ] Déployer branche main → Production

- [ ] Configurer preview deployments (branches feature/*)

**Critères de validation :**
- [ ] App déployée sur Vercel
- [ ] Prisma migrations s'exécutent
- [ ] Better Auth fonctionne en prod
- [ ] Preview URLs pour chaque PR

---

### 2.5 Prisma Client Helper (1h)

- [ ] Créer `lib/db/prisma.ts` (si pas déjà fait Phase 0) :
  ```ts
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  export const prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
  ```

- [ ] Créer types helpers `lib/db/types.ts` :
  ```ts
  import type { Task, User, TimeBlock, DailyReflection, RecurringTask } from '@prisma/client';

  export type { Task, User, TimeBlock, DailyReflection, RecurringTask };

  // Helpers types
  export type TaskWithSubtasks = Task & {
    subtasks: Task[];
  };

  export type TimeBlockWithTask = TimeBlock & {
    task: Task | null;
  };

  export type UserWithPreferences = User & {
    preferences: {
      chronotype: string;
      workHours: Record<string, { start: string; end: string }>;
      warRoomSchedule: { day: string; time: string };
      pomodoroLength: number;
      breakLength: number;
      ultradianWork: number;
      ultradianBreak: number;
      bufferPercentage: number;
      maxRescuePerWeek: number;
      optionalEscalationWeeks: number;
    };
  };
  ```

---

## Critères de Succès

- [ ] Prisma schema complet (Task, TimeBlock, RecurringTask, DailyReflection)
- [ ] Migrations appliquées sur Neon
- [ ] Vitest coverage configuré (80% target)
- [ ] CI/CD fonctionnel (GitHub Actions)
- [ ] Deployment Vercel configuré
- [ ] Prisma client accessible via `lib/db/prisma.ts`
- [ ] Prêt pour Phase 3 (Auth + Onboarding)

---

## Risques

**Risque 1 : Prisma migrations en production**
- **Impact :** Downtime si migration échoue
- **Mitigation :** Toujours tester sur staging DB d'abord

**Risque 2 : Coverage 80% difficile à atteindre**
- **Impact :** CI bloqué
- **Mitigation :** Commencer avec threshold plus bas (60%), augmenter progressivement

**Risque 3 : Vercel cold starts (Neon)**
- **Impact :** Première requête lente
- **Mitigation :** Acceptable pour MVP, optimiser en Phase 10 si besoin

---

## Notes

- Phase 0 a déjà setup l'architecture, on ajoute juste les models
- Pas besoin de monorepo/Turborepo (déjà décidé)
- Better Auth déjà configuré (Phase 0)
- Vitest déjà configuré (Phase 0)
- On focus sur Prisma + CI/CD + Deployment

---

**Prochaine phase :** Phase 3 - Auth + Onboarding
