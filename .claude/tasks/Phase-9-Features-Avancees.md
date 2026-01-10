# Phase 9 : Features Avancées

**Durée :** Semaine 10 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Gestion récurrentes avec escalade
- [ ] Système de notifications push
- [ ] Stats avancées (graphiques)
- [ ] Export/Import données
- [ ] Dark mode

---

## Tasks

### 9.1 Récurrentes avec Escalade

**Durée estimée :** 6h

#### Logic Escalade

- [ ] Créer cron job (ou Vercel Cron) pour détecter escalade :

```ts
// app/api/cron/escalate-recurring/route.ts

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all recurring tasks with escalation enabled
  const recurringTasks = await prisma.recurringTask.findMany({
    where: {
      escalationEnabled: true,
    },
    include: {
      user: true,
    },
  });

  for (const recurring of recurringTasks) {
    // Check if skipped count >= escalation threshold
    if (recurring.skippedCount >= recurring.escalationAfterSkips) {
      // Find next escalation day (e.g., Friday)
      const nextEscalationDay = getNextDayOfWeek(
        new Date(),
        recurring.escalationDay
      );

      // Create time block (Sacred, non-movable)
      await prisma.timeBlock.create({
        data: {
          userId: recurring.userId,
          date: nextEscalationDay,
          startTime: '14:00', // Default
          endTime: addMinutes('14:00', recurring.estimatedDuration),
          type: 'deep_work',
          priority: recurring.escalationPriority,
          taskTitle: `${recurring.title} (Escalade)`,
          isFree: false,
        },
      });

      // Send notification
      await sendNotification(recurring.userId, {
        title: 'Escalade automatique',
        body: `${recurring.title} : skipée ${recurring.skippedCount} fois. Je la force ${format(nextEscalationDay, 'EEEE')} 14h (${recurring.escalationPriority}).`,
        type: 'escalation',
      });

      // Reset skip count
      await prisma.recurringTask.update({
        where: { id: recurring.id },
        data: { skippedCount: 0 },
      });
    }
  }

  return Response.json({ success: true });
}
```

- [ ] Configurer Vercel Cron (vercel.json) :

```json
{
  "crons": [
    {
      "path": "/api/cron/escalate-recurring",
      "schedule": "0 8 * * *"
    }
  ]
}
```

#### UI Recurring Tasks

- [ ] Afficher dans Settings > Récurrentes :
  - Liste toutes les récurrentes
  - Skip count visible (3/4 skips)
  - Warning si proche escalade : "⚠️ Escalade dans 1 skip"

**Tests :**
- [ ] Test cron → escalade détectée
- [ ] Test time block créé (Sacred)
- [ ] Test notification envoyée
- [ ] Test skip count reset après escalade

---

### 9.2 Notifications Push

**Durée estimée :** 8h

#### Web Push API

- [ ] Installer dependencies :
  ```bash
  pnpm add web-push
  ```

- [ ] Générer VAPID keys :
  ```bash
  npx web-push generate-vapid-keys
  ```

- [ ] Ajouter dans .env :
  ```
  VAPID_PUBLIC_KEY="..."
  VAPID_PRIVATE_KEY="..."
  ```

#### Service Worker

- [ ] Créer `public/sw.js` :

```js
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

- [ ] Register service worker dans `app/layout.tsx` :

```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

#### Subscribe User

- [ ] Créer `components/notifications/NotificationSubscribe.tsx` :

```tsx
async function handleSubscribe() {
  if (!('Notification' in window)) {
    toast.error('Notifications not supported');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    toast.error('Notification permission denied');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  // Save subscription to DB
  await saveSubscription(subscription);

  toast.success('Notifications activées');
}
```

#### Server Action : Save Subscription

```ts
'use server';

export async function saveSubscription(subscription: PushSubscription) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      pushSubscription: subscription as any,
    },
  });
}
```

#### Send Notification

- [ ] Créer `lib/notifications/send.ts` :

```ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:contact@devflow.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    url?: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscription: true },
  });

  if (!user?.pushSubscription) {
    return; // User not subscribed
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url || '/dashboard',
  });

  try {
    await webpush.sendNotification(user.pushSubscription, payload);
  } catch (error) {
    console.error('Failed to send notification:', error);

    // If subscription expired, remove it
    if (error.statusCode === 410) {
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null },
      });
    }
  }
}
```

#### Notification Triggers

- [ ] Morning briefing (8h30) :
  ```ts
  await sendNotification(userId, {
    title: 'Morning Briefing',
    body: 'Tes priorités du jour : ...',
    url: '/dashboard',
  });
  ```

- [ ] Before task (15 min avant) :
  ```ts
  await sendNotification(userId, {
    title: 'Tâche à venir',
    body: `Dans 15 min : ${task.title}`,
    url: `/dashboard`,
  });
  ```

- [ ] Daily reflection (18h30) :
  ```ts
  await sendNotification(userId, {
    title: 'Daily Reflection',
    body: 'Journée terminée. Daily reflection (5 min) ?',
    url: '/dashboard',
  });
  ```

**Tests :**
- [ ] Test subscribe → subscription saved
- [ ] Test send notification → notification reçue
- [ ] Test click notification → redirect vers URL

---

### 9.3 Stats Avancées (Graphiques)

**Durée estimée :** 6h

#### Library

- [ ] Installer Recharts :
  ```bash
  pnpm add recharts
  ```

#### Page Stats

- [ ] Créer `app/stats/page.tsx` :
  - Tabs : Week, Month, All Time
  - Graphiques :
    1. Completion Rate (line chart)
    2. Focus Quality (area chart)
    3. Energy Level (bar chart)
    4. Hours per Day (bar chart)
    5. Priority Distribution (pie chart)

#### Graphique 1 : Completion Rate

- [ ] Créer `components/stats/CompletionRateChart.tsx` :

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function CompletionRateChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="completionRate" stroke="#3B82F6" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

**Server Action : Get Stats**

```ts
'use server';

export async function getWeeklyStats(userId: string, weekStartDate: Date) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const stats = await Promise.all(
    days.map(async (day) => {
      const reflection = await prisma.dailyReflection.findUnique({
        where: {
          userId_date: {
            userId,
            date: day,
          },
        },
      });

      return {
        date: format(day, 'EEE'),
        completionRate: reflection
          ? (reflection.completedTasks / reflection.totalTasks) * 100
          : 0,
        focusQuality: reflection?.focusQuality || 0,
        energyLevel: reflection?.energyLevel || 0,
      };
    })
  );

  return stats;
}
```

**Tests :**
- [ ] Test graphiques affichés correctement
- [ ] Test données calculées
- [ ] Test responsive (mobile)

---

### 9.4 Export/Import Données

**Durée estimée :** 4h

#### Export

- [ ] Créer `app/api/export/route.ts` :

```ts
export async function GET(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tasks: true,
      recurringTasks: true,
      timeBlocks: true,
      dailyReflections: true,
    },
  });

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
      preferences: user.preferences,
    },
    tasks: user.tasks,
    recurringTasks: user.recurringTasks,
    timeBlocks: user.timeBlocks,
    dailyReflections: user.dailyReflections,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="devflow-export-${format(new Date(), 'yyyy-MM-dd')}.json"`,
    },
  });
}
```

#### Import

- [ ] Créer `app/api/import/route.ts` :

```ts
export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const importData = await req.json();

  // Validate version
  if (importData.version !== '1.0') {
    return new Response('Invalid export version', { status: 400 });
  }

  // Import tasks
  await prisma.task.createMany({
    data: importData.tasks.map((task: any) => ({
      ...task,
      userId: session.user.id,
    })),
  });

  // Import recurring tasks
  await prisma.recurringTask.createMany({
    data: importData.recurringTasks.map((rt: any) => ({
      ...rt,
      userId: session.user.id,
    })),
  });

  // Import time blocks
  await prisma.timeBlock.createMany({
    data: importData.timeBlocks.map((tb: any) => ({
      ...tb,
      userId: session.user.id,
    })),
  });

  // Import reflections
  await prisma.dailyReflection.createMany({
    data: importData.dailyReflections.map((dr: any) => ({
      ...dr,
      userId: session.user.id,
    })),
  });

  return Response.json({ success: true });
}
```

#### UI

- [ ] Ajouter dans Settings > Data :
  - Bouton "Export données"
  - Bouton "Import données" (file upload)

**Tests :**
- [ ] Test export → fichier JSON téléchargé
- [ ] Test import → données restaurées

---

### 9.5 Dark Mode

**Durée estimée :** 3h

#### Implementation (next-themes)

- [ ] Installer next-themes :
  ```bash
  pnpm add next-themes
  ```

- [ ] Wrapper app dans `ThemeProvider` :

```tsx
// app/providers.tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

- [ ] Créer `components/ThemeToggle.tsx` :

```tsx
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] Update `tailwind.config.ts` :

```ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... autres couleurs
      },
    },
  },
};
```

- [ ] Créer CSS variables (globals.css) :

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... autres variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... autres variables */
  }
}
```

**Tests :**
- [ ] Test toggle → theme change
- [ ] Test persistence (localStorage)
- [ ] Test system preference detection

---

## Critères de Succès

- [ ] Récurrentes avec escalade fonctionnelles
- [ ] Notifications push activées
- [ ] Stats avancées avec graphiques
- [ ] Export/Import données
- [ ] Dark mode implémenté
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 10 (Tests + QA)

---

## Risques

**Risque 1 : Web Push non supporté (iOS Safari)**
- **Impact :** iOS users sans notifications
- **Mitigation :** Fallback email notifications

**Risque 2 : Export/Import corrompt données**
- **Impact :** User perd données
- **Mitigation :** Validation stricte, backup avant import

**Risque 3 : Dark mode cassé (contraste)**
- **Impact :** UX dégradée
- **Mitigation :** Tester tous les composants en dark mode

---

## Notes

- Notifications doivent être opt-in (user consent)
- Export régulier encouragé (backup)
- Dark mode par défaut selon system preference

---

**Prochaine phase :** Phase 10 - Tests + QA
