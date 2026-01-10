# Phase 10 : Tests + QA

**Durée :** Semaine 11 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Atteindre 80% test coverage
- [ ] Tests E2E (Playwright)
- [ ] Performance testing
- [ ] Security audit
- [ ] Bug fixing

---

## Tasks

### 10.1 Unit Tests (80% Coverage)

**Durée estimée :** 8h

#### Coverage Status

- [ ] Run coverage report :
  ```bash
  pnpm test:coverage
  ```

- [ ] Identifier modules < 80% coverage
- [ ] Prioriser :
  1. Business logic (lib/usecases, lib/ai, lib/stats)
  2. API routes (app/api)
  3. Components critiques (components/)

#### Business Logic (lib/usecases, lib/ai, lib/stats)

- [ ] Tests use cases :

```ts
// tests/usecases/GenerateWeeklyPlanning.test.ts

describe('GenerateWeeklyPlanningUseCase', () => {
  let useCase: GenerateWeeklyPlanningUseCase;
  let mockTaskRepo: ReturnType<typeof vi.mocked<ITaskRepository>>;
  let mockUserRepo: ReturnType<typeof vi.mocked<IUserRepository>>;

  beforeEach(() => {
    mockTaskRepo = {
      findByUserId: vi.fn(),
      // ...
    };
    mockUserRepo = {
      findById: vi.fn(),
      // ...
    };
    useCase = new GenerateWeeklyPlanningUseCase(mockTaskRepo, mockUserRepo, mockTimeBlockRepo);
  });

  it('should generate planning with peak hours for difficult tasks', async () => {
    // Arrange
    const user = {
      id: '1',
      preferences: {
        chronotype: 'bear',
        workHours: {
          monday: { start: '08:00', end: '19:00' },
        },
      },
    };
    const tasks = [
      { id: '1', difficulty: 5, priority: 'sacred', estimatedDuration: 120 },
      { id: '2', difficulty: 2, priority: 'important', estimatedDuration: 60 },
    ];

    mockUserRepo.findById.mockResolvedValueOnce(user);
    mockTaskRepo.findByUserId.mockResolvedValueOnce(tasks);

    // Act
    const result = await useCase.execute({
      userId: '1',
      weekStartDate: new Date('2026-01-05'),
    });

    // Assert
    expect(result.timeBlocks.length).toBeGreaterThan(0);

    // Difficult task should be on peak hours (10h-12h for bear)
    const difficultBlock = result.timeBlocks.find((tb) => tb.taskId === '1');
    expect(difficultBlock.startTime).toBe('10:00');
  });

  it('should add 20% buffer time', async () => {
    // ... test buffer calculation
  });

  it('should add 2 rescue slots on Friday', async () => {
    // ... test rescue slots
  });

  it('should validate dependencies (task B after task A)', async () => {
    // ... test dependencies
  });

  it('should throw error if overloaded (> 20h)', async () => {
    // ... test overload validation
  });
});
```

#### API Routes

- [ ] Tests API endpoints :

```ts
// tests/api/tasks/route.test.ts

import { POST } from '@/app/api/tasks/route';
import { auth } from '@/lib/auth/auth';

describe('POST /api/tasks', () => {
  it('should create a task', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com' },
    };

    vi.spyOn(auth.api, 'getSession').mockResolvedValue(mockSession);

    const req = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        priority: 'important',
        difficulty: 3,
        estimatedDuration: 60,
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Task');
  });

  it('should return 401 if not authenticated', async () => {
    vi.spyOn(auth.api, 'getSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
  });
});
```

#### Components

- [ ] Tests React components :

```tsx
// tests/components/TaskCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/backlog/TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    priority: 'important',
    difficulty: 3,
    estimatedDuration: 60,
  };

  it('should render task title', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should display priority badge', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('🟠')).toBeInTheDocument(); // important
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByText('Éditer'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should display difficulty stars', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('⭐⭐⭐')).toBeInTheDocument();
  });
});
```

**Tests Coverage Goal :**
- lib/ : 85%+
- app/api/ : 80%+
- components/ : 75%+
- cli/ : 80%+

---

### 10.2 E2E Tests (Playwright)

**Durée estimée :** 8h

#### Setup

- [ ] Installer Playwright :
  ```bash
  pnpm add -D @playwright/test
  npx playwright install
  ```

- [ ] Créer `playwright.config.ts` :

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E Tests

- [ ] Test Flow : Signup → Onboarding → Dashboard

```ts
// tests/e2e/onboarding.spec.ts

import { test, expect } from '@playwright/test';

test('complete onboarding flow', async ({ page }) => {
  // 1. Signup
  await page.goto('/signup');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 2. Onboarding
  await expect(page).toHaveURL('/onboarding');

  // Question 1: Chronotype
  await page.click('text=Matin');
  await page.click('button:has-text("Suivant")');

  // Question 2: Horaires
  await page.click('text=10h-12h');
  await page.click('button:has-text("Suivant")');

  // Question 3: War Room
  await page.click('button:has-text("Vendredi 17h (défaut)")');
  await page.click('button:has-text("Terminer")');

  // 3. Dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Bienvenue')).toBeVisible();
});
```

- [ ] Test Flow : Créer Task → Backlog → War Room → Planning

```ts
// tests/e2e/planning.spec.ts

test('create task and plan week', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 1. Create task
  await page.goto('/backlog');
  await page.click('button:has-text("+ Nouvelle tâche")');

  await page.fill('input[name="title"]', 'SEPA Backend');
  await page.selectOption('select[name="priority"]', 'sacred');
  await page.fill('input[name="estimatedDuration"]', '180');
  await page.click('button:has-text("Créer")');

  // Verify task in backlog
  await expect(page.locator('text=SEPA Backend')).toBeVisible();

  // 2. War Room
  await page.goto('/weekly');
  await page.click('button:has-text("War Room")');

  // Drag task to Monday 10h
  const task = page.locator('text=SEPA Backend');
  const slot = page.locator('[data-day="monday"][data-time="10:00"]');
  await task.dragTo(slot);

  await page.click('button:has-text("Confirmer Planning")');

  // Verify task planned
  await expect(page.locator('[data-day="monday"] >> text=SEPA Backend')).toBeVisible();
});
```

- [ ] Test Flow : Timer → Focus Mode → Daily Reflection

```ts
// tests/e2e/execution.spec.ts

test('execute task with timer', async ({ page }) => {
  await page.goto('/login');
  // ... login

  await page.goto('/dashboard');

  // Start task
  await page.click('button:has-text("Commencer")');

  // Choose timer mode
  await page.click('text=Pomodoro');

  // Verify timer running
  await expect(page.locator('text=25:00')).toBeVisible();

  // Enter focus mode
  await page.click('button:has-text("Enter Focus Mode")');
  await expect(page.locator('.focus-mode')).toBeVisible();

  // Exit focus mode
  await page.keyboard.press('Escape');
  await expect(page.locator('.focus-mode')).not.toBeVisible();

  // Stop timer
  await page.click('button:has-text("Stop")');

  // Daily reflection
  await page.goto('/dashboard');
  await page.click('button:has-text("Daily Reflection")');

  await page.click('text=4'); // Focus quality
  await page.click('text=3'); // Energy level
  await page.fill('textarea[name="wins"]', 'Terminé SEPA');
  await page.click('button:has-text("Sauvegarder")');

  await expect(page.locator('text=Reflection sauvegardée')).toBeVisible();
});
```

**Tests E2E Goal :**
- 5 flows critiques couverts
- Screenshots on failure
- Video recording on CI

---

### 10.3 Performance Testing

**Durée estimée :** 4h

#### Lighthouse CI

- [ ] Installer Lighthouse CI :
  ```bash
  pnpm add -D @lhci/cli
  ```

- [ ] Créer `lighthouserc.js` :

```js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/dashboard', 'http://localhost:3000/backlog'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
};
```

- [ ] Ajouter script :
  ```json
  {
    "scripts": {
      "lighthouse": "lhci autorun"
    }
  }
  ```

#### Bundle Size Analysis

- [ ] Analyzer Next.js bundle :
  ```bash
  pnpm add -D @next/bundle-analyzer
  ```

- [ ] Update `next.config.js` :
  ```js
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });

  module.exports = withBundleAnalyzer({
    // ... config
  });
  ```

- [ ] Run analysis :
  ```bash
  ANALYZE=true pnpm build
  ```

**Performance Goals :**
- Lighthouse Performance > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Bundle size < 300KB (gzipped)

---

### 10.4 Security Audit

**Durée estimée :** 4h

#### npm audit

- [ ] Run audit :
  ```bash
  pnpm audit
  ```

- [ ] Fix vulnerabilities :
  ```bash
  pnpm audit fix
  ```

#### OWASP Top 10

- [ ] SQL Injection :
  - ✅ Prisma protège automatiquement (parameterized queries)

- [ ] XSS (Cross-Site Scripting) :
  - ✅ React escape automatiquement
  - [ ] Valider input user (Zod)
  - [ ] Sanitize HTML si nécessaire (DOMPurify)

- [ ] CSRF (Cross-Site Request Forgery) :
  - ✅ Better Auth protège automatiquement (CSRF token)

- [ ] Authentication :
  - [ ] Password hashing (bcrypt)
  - [ ] JWT signed (Better Auth)
  - [ ] Session expiration (7 days)

- [ ] Authorization :
  - [ ] Toujours vérifier userId dans API routes
  - [ ] Middleware protège routes privées

- [ ] Sensitive Data Exposure :
  - [ ] HTTPS only (Vercel)
  - [ ] Environment variables sécurisées
  - [ ] Pas de secrets dans client-side code

#### Rate Limiting

- [ ] Ajouter rate limiting (Upstash) :

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10s
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // ... rest of handler
}
```

**Security Checklist :**
- [ ] No known vulnerabilities (npm audit)
- [ ] Input validation (Zod)
- [ ] Authentication secure (bcrypt + JWT)
- [ ] Authorization enforced (middleware)
- [ ] Rate limiting on API routes
- [ ] HTTPS enforced
- [ ] Secrets in environment variables

---

### 10.5 Bug Fixing

**Durée estimée :** 4h

#### Bug Triage

- [ ] Créer liste bugs détectés pendant tests
- [ ] Prioriser :
  - P0 : Bloquant (app crash, data loss)
  - P1 : Critique (feature non fonctionnelle)
  - P2 : Majeur (UX dégradée)
  - P3 : Mineur (cosmetic)

#### Common Bugs

- [ ] Drag & drop bug (colonnes Kanban)
- [ ] Timer drift (imprécision countdown)
- [ ] Notifications non reçues (service worker)
- [ ] Dark mode contrast issues
- [ ] Mobile responsiveness bugs
- [ ] AI suggestions hors contexte
- [ ] Planning overload non détecté

**Bug Fixing Process :**
1. Reproduire bug
2. Écrire test qui fail
3. Fix bug
4. Test passe
5. Commit + PR

---

## Critères de Succès

- [ ] Test coverage > 80%
- [ ] 5 flows E2E passent
- [ ] Performance Lighthouse > 90
- [ ] Security audit clean
- [ ] Tous les bugs P0/P1 fixés
- [ ] CI/CD passe (tests + build)
- [ ] Prêt pour Phase 11 (Polish + Docs)

---

## Risques

**Risque 1 : Coverage < 80%**
- **Impact :** Qualité code non garantie
- **Mitigation :** Prioriser business logic, skip UI tests si nécessaire

**Risque 2 : E2E tests flaky**
- **Impact :** CI instable
- **Mitigation :** Retries, waitForSelector, stable selectors

**Risque 3 : Performance < 90**
- **Impact :** UX dégradée
- **Mitigation :** Code splitting, lazy loading, image optimization

---

## Notes

- Tests doivent être rapides (< 5 min total)
- E2E tests sur CI uniquement (pas local)
- Performance testing sur production build

---

**Prochaine phase :** Phase 11 - Polish + Documentation
