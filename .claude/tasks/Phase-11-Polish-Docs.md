# Phase 11 : Polish + Documentation

**Durée :** Semaine 12 (3 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] UI/UX polish (animations, micro-interactions)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Documentation (README, API docs)
- [ ] Onboarding guides
- [ ] Error handling refinement

---

## Tasks

### 11.1 UI/UX Polish

**Durée estimée :** 6h

#### Animations (Framer Motion)

- [ ] Installer Framer Motion :
  ```bash
  pnpm add framer-motion
  ```

- [ ] Animer transitions pages :

```tsx
// app/layout.tsx

import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] Animer TaskCard drag & drop :

```tsx
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  <TaskCard {...props} />
</motion.div>
```

- [ ] Animer Modal apparition :

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
  >
    <DialogContent>
      {/* ... */}
    </DialogContent>
  </motion.div>
</Dialog>
```

#### Micro-interactions

- [ ] Button hover effects :
  ```css
  .button {
    transition: all 0.2s ease;
  }
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  ```

- [ ] Toast notifications (sonner) :
  ```bash
  pnpm add sonner
  ```

  ```tsx
  import { toast } from 'sonner';

  toast.success('Tâche créée');
  toast.error('Erreur lors de la création');
  toast.loading('Chargement...');
  ```

- [ ] Loading skeletons :
  ```tsx
  import { Skeleton } from '@/components/ui/skeleton';

  {isLoading ? (
    <Skeleton className="h-20 w-full" />
  ) : (
    <TaskCard task={task} />
  )}
  ```

#### Responsive Design

- [ ] Tester toutes les pages sur mobile :
  - Dashboard
  - Backlog
  - Weekly View
  - Settings
  - Timer

- [ ] Ajuster breakpoints :
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* ... */}
  </div>
  ```

- [ ] Mobile menu (hamburger) :
  ```tsx
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu />
      </Button>
    </SheetTrigger>
    <SheetContent side="left">
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/backlog">Backlog</Link>
        <Link href="/weekly">Weekly</Link>
        <Link href="/stats">Stats</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </SheetContent>
  </Sheet>
  ```

**Polish Checklist :**
- [ ] Animations fluides (60fps)
- [ ] Loading states partout
- [ ] Error states affichées
- [ ] Empty states avec CTA
- [ ] Responsive mobile/tablet/desktop
- [ ] Hover effects cohérents
- [ ] Focus states visibles (keyboard navigation)

---

### 11.2 Accessibility (WCAG 2.1 AA)

**Durée estimée :** 6h

#### Semantic HTML

- [ ] Utiliser balises sémantiques :
  ```tsx
  <header>
    <nav>
      <Link href="/dashboard">Dashboard</Link>
    </nav>
  </header>

  <main>
    {/* Page content */}
  </main>

  <footer>
    {/* Footer */}
  </footer>
  ```

#### ARIA Labels

- [ ] Ajouter labels sur boutons icônes :
  ```tsx
  <Button aria-label="Supprimer tâche">
    <Trash />
  </Button>
  ```

- [ ] Ajouter roles :
  ```tsx
  <div role="alert">Erreur : impossible de créer la tâche</div>
  ```

#### Keyboard Navigation

- [ ] Tester navigation clavier (Tab, Enter, Esc)
- [ ] Focus visible :
  ```css
  *:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }
  ```

- [ ] Skip to content link :
  ```tsx
  <a href="#main-content" className="sr-only focus:not-sr-only">
    Skip to content
  </a>
  ```

#### Color Contrast

- [ ] Vérifier contraste texte (WCAG AA : 4.5:1)
- [ ] Tools : WebAIM Contrast Checker
- [ ] Éviter rouge/vert uniquement (colorblind-friendly)

#### Screen Readers

- [ ] Tester avec VoiceOver (Mac) ou NVDA (Windows)
- [ ] Alt text sur images :
  ```tsx
  <img src="/logo.png" alt="DevFlow logo" />
  ```

- [ ] Descriptions sur inputs :
  ```tsx
  <Label htmlFor="task-title">Titre de la tâche</Label>
  <Input id="task-title" aria-describedby="task-title-hint" />
  <p id="task-title-hint" className="text-sm text-muted-foreground">
    Max 100 caractères
  </p>
  ```

**Accessibility Checklist :**
- [ ] Semantic HTML partout
- [ ] ARIA labels sur éléments interactifs
- [ ] Keyboard navigation complète
- [ ] Focus visible
- [ ] Color contrast WCAG AA
- [ ] Screen reader compatible
- [ ] Forms accessibles (labels, hints, errors)

---

### 11.3 Documentation

**Durée estimée :** 6h

#### README.md

- [ ] Créer README.md complet :

```markdown
# DevFlow

> Productivity system for 10x developers

## Features

- ⏱️ Time-blocking with chronotype optimization
- 🐸 Eat the Frog (hardest task first)
- 🔄 Weekly War Room (planning)
- 📊 Daily Reflection + AI Insights
- 🤖 DevFlow AI (proactive assistant)
- ⌨️ DevFlow CLI (rapid task import)
- 📱 Notifications push
- 🌙 Dark mode

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL (Neon)
- OpenAI GPT-4o-mini
- Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL (Neon account)

### Installation

\`\`\`bash
git clone https://github.com/yourusername/devflow.git
cd devflow
pnpm install
\`\`\`

### Setup

1. Copy `.env.example` to `.env`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Configure environment variables:
   \`\`\`
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="..."
   NEXTAUTH_URL="http://localhost:3000"
   OPENAI_API_KEY="sk-..."
   \`\`\`

3. Run migrations:
   \`\`\`bash
   pnpm prisma migrate dev
   \`\`\`

4. Start dev server:
   \`\`\`bash
   pnpm dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

## CLI Usage

### Install CLI

\`\`\`bash
cd packages/cli
pnpm link
\`\`\`

### Commands

\`\`\`bash
# Login
devflow login

# Create task
devflow add "Implement SEPA" -p sacred --difficulty 4 -e 180

# List tasks
devflow list

# Show weekly planning
devflow week

# Stats
devflow stats --week
\`\`\`

## Architecture

\`\`\`
devflow/
├── packages/
│   ├── core/          # Business logic (Clean Architecture)
│   ├── api/           # Next.js API + Server Actions
│   ├── web/           # Next.js frontend
│   └── cli/           # Node.js CLI tool
\`\`\`

## Testing

\`\`\`bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
\`\`\`

## Deployment

### Vercel

1. Connect GitHub repo
2. Configure environment variables
3. Deploy

### Database Migrations

Migrations run automatically on deploy (Prisma).

## License

MIT
```

#### API Documentation

- [ ] Créer `docs/API.md` :

```markdown
# DevFlow API Documentation

Base URL: `https://devflow.vercel.app/api`

## Authentication

All endpoints require authentication via NextAuth session.

## Endpoints

### Tasks

#### GET /tasks

List all tasks.

**Query Parameters:**
- `status` (optional): Filter by status (inbox/todo/doing/done)
- `priority` (optional): Filter by priority (sacred/important/optional)

**Response:**
\`\`\`json
[
  {
    "id": "clx...",
    "title": "SEPA Backend",
    "priority": "sacred",
    "difficulty": 4,
    "estimatedDuration": 180,
    "status": "todo",
    "createdAt": "2026-01-05T10:00:00Z"
  }
]
\`\`\`

#### POST /tasks

Create a new task.

**Body:**
\`\`\`json
{
  "title": "SEPA Backend",
  "description": "Implement SEPA with Stripe",
  "priority": "sacred",
  "difficulty": 4,
  "estimatedDuration": 180,
  "deadline": "2026-01-10",
  "quarter": "Q1-2026"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "clx...",
  "title": "SEPA Backend",
  ...
}
\`\`\`

#### GET /tasks/:id

Get task details.

#### PUT /tasks/:id

Update a task.

#### DELETE /tasks/:id

Delete a task.

### Planning

#### POST /planning/generate

Generate weekly planning.

**Body:**
\`\`\`json
{
  "weekStartDate": "2026-01-06"
}
\`\`\`

**Response:**
\`\`\`json
{
  "timeBlocks": [...],
  "totalHours": 18,
  "bufferHours": 4,
  "rescueSlots": 2
}
\`\`\`

### Stats

#### GET /stats/weekly

Get weekly stats.

#### GET /stats/monthly

Get monthly stats.
```

#### User Guides

- [ ] Créer `docs/USER_GUIDE.md` :

```markdown
# DevFlow User Guide

## 1. Getting Started

### Signup & Onboarding

1. Create account (email/password)
2. Answer 3 questions:
   - Chronotype (Bear/Lion/Wolf/Dolphin)
   - Work hours (8h-19h default)
   - War Room schedule (Friday 17h default)

### Dashboard

Your daily command center:
- Top 3 priorities
- Timeline (time blocks)
- Progress bar
- DevFlow AI chatbot

## 2. Creating Tasks

### Via Web UI

1. Go to Backlog
2. Click "+ Nouvelle tâche"
3. Fill form:
   - Title (required)
   - Priority (Sacred/Important/Optional)
   - Difficulty (1-5)
   - Estimated duration (minutes)
   - Deadline (optional)
4. Click "Créer"

### Via CLI

\`\`\`bash
devflow add "Implement SEPA" -p sacred --difficulty 4 -e 180
\`\`\`

### Via Voice + Claude Code

1. Record voice memo (ChatGPT Voice)
2. Save transcript to ~/devflow-workspace/transcripts/
3. Open Claude Code:
   \`\`\`
   Claude, utilise task-creator pour importer mes tâches
   \`\`\`
4. Validate generated commands
5. Tasks created in DevFlow

## 3. Weekly Planning (War Room)

### When

Every Friday at 17h (configurable).

### How

1. Notification: "War Room dans 15 min"
2. Click → Modal opens
3. Review last week:
   - Tasks completed
   - Stats
   - AI insights
4. Plan next week:
   - Drag tasks from Backlog to Weekly View
   - AI suggests optimal time slots (peak hours)
   - Validate charge (max 20h/week)
5. Click "Confirmer Planning"
6. Week planned!

## 4. Daily Execution

### Morning

- Notification (8h30): "Tes priorités du jour"
- Review Dashboard
- Click "Commencer" on first task (Frog)

### During Day

- Timer starts (Pomodoro 25/5 or Ultradian 90/20)
- Focus Mode (fullscreen, distraction-free)
- Break notifications
- Next task suggested automatically

### Evening

- Notification (18h30): "Daily Reflection"
- Answer 2 questions:
  - Focus Quality (1-5)
  - Energy Level (1-5)
- Optional: wins, struggles
- AI generates insights

## 5. Tips & Best Practices

### Chronotype Optimization

- **Bear** (50% population): Peak 10h-12h, 16h-18h
- **Lion** (15%): Peak 8h-10h, 14h-16h
- **Wolf** (15%): Peak 16h-18h, 20h-22h
- **Dolphin** (10%): Variable peak (10h-12h default)

Place difficult tasks (4-5⭐) on peak hours.

### Eat the Frog

Start with hardest task (highest difficulty).

### Buffer Time

20% of week = free slots (flexibility).

### Rescue Slots

2 slots/week (Friday afternoon) for emergencies.

### Recurring Tasks

- Set escalation (auto-upgrade to Sacred if skipped 4x)
- Examples: Weekly review, CRM check, Veille techno

## 6. Troubleshooting

### Notifications not working?

1. Check browser permissions
2. Re-subscribe in Settings > Notifications

### Timer not precise?

Browser throttles inactive tabs. Keep timer tab active.

### AI suggestions wrong?

AI learns from your patterns. Give it 2-3 weeks.

### Planning overloaded?

Reduce tasks or increase estimates. Aim for 16-18h/week.
```

---

### 11.4 Error Handling Refinement

**Durée estimée :** 3h

#### Global Error Boundary

- [ ] Créer `app/error.tsx` :

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Oups, une erreur est survenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error.message || 'Quelque chose s'est mal passé.'}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Réessayer</Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Retour au Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

#### API Error Responses

- [ ] Standardiser format erreurs :

```ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  return Response.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}
```

#### User-Friendly Error Messages

- [ ] Remplacer messages techniques :

```ts
// Bad
throw new Error('FOREIGN KEY constraint failed');

// Good
throw new ApiError(400, 'Cette tâche dépend d'une autre tâche qui n'existe plus.', 'DEPENDENCY_NOT_FOUND');
```

**Error Handling Checklist :**
- [ ] Global error boundary
- [ ] API errors standardisés
- [ ] User-friendly messages
- [ ] Retry mechanisms
- [ ] Error logging (Sentry, optional)

---

## Critères de Succès

- [ ] Animations fluides partout
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Accessibility WCAG 2.1 AA
- [ ] Documentation complète (README, API, User Guide)
- [ ] Error handling robuste
- [ ] Loading/Empty/Error states polished
- [ ] Prêt pour Phase 12 (Launch)

---

## Risques

**Risque 1 : Animations trop lourdes**
- **Impact :** Performance dégradée
- **Mitigation :** Utiliser CSS transforms (GPU-accelerated)

**Risque 2 : Documentation obsolète**
- **Impact :** User confusion
- **Mitigation :** Update docs à chaque feature change

**Risque 3 : Accessibility non testée**
- **Impact :** Users disabled exclus
- **Mitigation :** Tests screen reader + keyboard navigation

---

## Notes

- Polish ne doit pas prendre plus de 3 jours
- Focus sur features critiques (Dashboard, Backlog, Weekly)
- Documentation vivante (update régulière)

---

**Prochaine phase :** Phase 12 - Launch Preparation
