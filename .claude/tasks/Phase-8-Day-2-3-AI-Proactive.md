# Phase 8 - Jour 2-3 : AI Proactive (Suggestions + Warnings)

**Durée :** 2 jours
**Statut :** 🟡 À faire
**Dépendances :** Jour 1 (Context Management)

---

## Objectif

Implémenter les suggestions proactives de DevFlow AI (morning briefing, warnings, pattern detection).

---

## Jour 2 : Suggestion Engine (8h)

### 1. Proactive Suggestion Generator (3h)

- [ ] Créer `lib/ai/proactive.ts`
- [ ] Function `generateProactiveSuggestion(userId, moment, additionalContext?)`
- [ ] Moments supportés :
  - `morning_briefing` (8h30)
  - `before_task` (15 min avant tâche)
  - `end_task` (tâche terminée)
  - `overload_warning` (War Room)
  - `pattern_detection` (insights patterns)
  - `escalation_warning` (tâche récurrente)

- [ ] Implementation :
  ```ts
  type ProactiveMoment =
    | 'morning_briefing'
    | 'before_task'
    | 'end_task'
    | 'overload_warning'
    | 'pattern_detection'
    | 'escalation_warning';

  export async function generateProactiveSuggestion(
    userId: string,
    moment: ProactiveMoment,
    additionalContext?: any
  ): Promise<string> {
    // 1. Get user context
    const context = await getUserContextCached(userId);

    // 2. Build prompt selon moment
    const prompt = buildProactivePrompt(moment, context, additionalContext);

    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0].message.content || '';
  }
  ```

### 2. Prompt Templates (3h)

- [ ] Créer `lib/ai/prompts.ts`
- [ ] Templates pour chaque moment :

```ts
export const PROACTIVE_PROMPTS = {
  morning_briefing: `Tu es DevFlow AI, un assistant productivité pour développeurs.

C'est le matin. Donne un briefing concis des priorités du jour.

Contexte :
{context}

Ton style : concis (max 3 phrases), actionnable, friendly, dev-oriented.

Exemples :
"Salut ! Aujourd'hui : 3 tâches (1 difficile). Ton pic : 10h-12h. Commence par SEPA Backend."
"Journée light : 2 tâches importantes. Profites-en pour faire de la veille techno."
"Attention : journée chargée (18h prévues). Priorise tes 2 tâches sacrées."

Génère le briefing.`,

  before_task: `Tu es DevFlow AI.

L'user va commencer une tâche dans 15 min. Donne un conseil.

Tâche : {task}
Contexte : {context}

Ton style : concis (1-2 phrases), actionnable.

Exemples :
"Dans 15 min : SEPA Backend (2h, difficile). Ferme Slack et active le timer."
"Prochaine : Bug fix (30 min, facile). Parfait pour finir la matinée."
"Attention : tâche difficile (4⭐). Prends ton café avant de commencer."

Génère le conseil.`,

  end_task: `Tu es DevFlow AI.

L'user vient de terminer une tâche. Félicite-le et suggère la suite.

Tâche terminée : {task}
Prochaine tâche : {nextTask}
Contexte : {context}

Ton style : concis (2 phrases), positif.

Exemples :
"SEPA Backend terminé. Bien joué ! Prochaine : Bug fix (16h). Prends 5 min de pause avant."
"Refacto terminé. Nice ! Plus qu'une tâche aujourd'hui : Check dons (14h-15h)."

Génère la suggestion.`,

  overload_warning: `Tu es DevFlow AI.

L'user planifie trop de travail cette semaine. Warn-le.

Charge : {totalHours}h / {maxHours}h
Contexte : {context}

Ton style : direct, actionnable.

Exemples :
"⚠️ Charge trop élevée : 22h/20h. Retire 2h de tâches ou réduis les estimations."
"⚠️ Planning surchargé (110%). Déplace 1-2 tâches importantes à la semaine prochaine."

Génère le warning.`,

  pattern_detection: `Tu es DevFlow AI.

Analyse les patterns de productivité et donne des insights.

Stats :
{stats}

Réflexions :
{reflections}

Ton style : concis, actionnable, insights data-driven.

Exemples :
"Tu es plus productif le mardi (focus 4.5/5, 90% completion). Planifie tes tâches difficiles ce jour-là."
"Tu utilises 2/2 créneaux secours chaque semaine. Augmente ton buffer à 25%."
"Focus quality corrélé à energy level (r=0.85). Dors plus pour être plus focus."

Génère 2-3 insights (max 2 lignes chacun).`,

  escalation_warning: `Tu es DevFlow AI.

Une tâche récurrente va escalader. Préviens l'user.

Tâche : {task}
Skips : {skippedCount}/{escalationThreshold}
Escalade : {escalationDay} {escalationTime}

Ton style : direct, actionnable.

Exemples :
"⚠️ Check dons CRM : skipée 3/4 fois. Elle escalade vendredi 14h (Sacré, indéplaçable)."
"⚠️ Veille techno : encore 1 skip et elle escalade demain (Important)."

Génère le warning.`,
};

export function buildProactivePrompt(
  moment: ProactiveMoment,
  context: any,
  additionalContext?: any
): string {
  let prompt = PROACTIVE_PROMPTS[moment];

  // Replace placeholders
  prompt = prompt.replace('{context}', serializeContext(context));

  if (additionalContext) {
    Object.entries(additionalContext).forEach(([key, value]) => {
      prompt = prompt.replace(`{${key}}`, JSON.stringify(value));
    });
  }

  return prompt;
}
```

### 3. Trigger Logic (2h)

- [ ] Créer `lib/ai/triggers.ts`
- [ ] Functions pour chaque trigger :

```ts
export async function triggerMorningBriefing(userId: string) {
  const suggestion = await generateProactiveSuggestion(userId, 'morning_briefing');

  await sendNotification(userId, {
    title: 'Morning Briefing',
    body: suggestion,
    type: 'morning_briefing',
    url: '/dashboard',
  });

  return suggestion;
}

export async function triggerBeforeTask(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  const suggestion = await generateProactiveSuggestion(userId, 'before_task', {
    task: {
      title: task.title,
      difficulty: task.difficulty,
      estimatedDuration: task.estimatedDuration,
    },
  });

  await sendNotification(userId, {
    title: 'Tâche à venir',
    body: suggestion,
    type: 'before_task',
    url: '/dashboard',
  });

  return suggestion;
}

export async function triggerEndTask(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  // Get next task
  const nextTask = await getNextTask(userId);

  const suggestion = await generateProactiveSuggestion(userId, 'end_task', {
    task: { title: task.title },
    nextTask: nextTask ? { title: nextTask.title, startTime: nextTask.startTime } : null,
  });

  await sendNotification(userId, {
    title: 'Tâche terminée',
    body: suggestion,
    type: 'end_task',
    url: '/dashboard',
  });

  return suggestion;
}

export async function triggerOverloadWarning(userId: string, totalHours: number, maxHours: number = 20) {
  const suggestion = await generateProactiveSuggestion(userId, 'overload_warning', {
    totalHours,
    maxHours,
  });

  return suggestion; // Displayed in War Room modal, no notification
}

export async function triggerPatternDetection(userId: string) {
  const stats = await calculateUserStats(userId, subDays(new Date(), 30), new Date());

  const reflections = await prisma.dailyReflection.findMany({
    where: {
      userId,
      date: { gte: subDays(new Date(), 30) },
    },
  });

  const suggestion = await generateProactiveSuggestion(userId, 'pattern_detection', {
    stats,
    reflections,
  });

  return suggestion; // Displayed in stats page or War Room
}

export async function triggerEscalationWarning(userId: string, recurringTaskId: string) {
  const recurringTask = await prisma.recurringTask.findUnique({
    where: { id: recurringTaskId },
  });

  const suggestion = await generateProactiveSuggestion(userId, 'escalation_warning', {
    task: { title: recurringTask.title },
    skippedCount: recurringTask.skippedCount,
    escalationThreshold: recurringTask.escalationAfterSkips,
    escalationDay: recurringTask.escalationDay,
    escalationTime: '14:00',
  });

  await sendNotification(userId, {
    title: 'Escalade imminente',
    body: suggestion,
    type: 'escalation_warning',
    url: '/settings?tab=recurring',
  });

  return suggestion;
}
```

---

## Jour 3 : Scheduling + Integration (8h)

### 4. Cron Jobs (Vercel Cron) (3h)

- [ ] Créer `app/api/cron/morning-briefing/route.ts` :
  ```ts
  export async function GET(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        // Add filter if needed (premium users only, etc.)
      },
    });

    // Trigger morning briefing for each user
    for (const user of users) {
      try {
        await triggerMorningBriefing(user.id);
      } catch (error) {
        console.error(`Failed to send morning briefing to ${user.id}:`, error);
      }
    }

    return Response.json({ success: true, count: users.length });
  }
  ```

- [ ] Créer `app/api/cron/before-task/route.ts` (check time blocks starting in 15 min)
- [ ] Créer `app/api/cron/escalation-check/route.ts` (check recurring tasks)

- [ ] Configurer `vercel.json` :
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/morning-briefing",
        "schedule": "0 8 * * *"
      },
      {
        "path": "/api/cron/before-task",
        "schedule": "*/15 * * * *"
      },
      {
        "path": "/api/cron/escalation-check",
        "schedule": "0 18 * * *"
      }
    ]
  }
  ```

### 5. Manual Triggers (2h)

- [ ] Permettre à l'user de trigger suggestions manuellement
- [ ] Créer `app/api/ai/suggest/route.ts` :
  ```ts
  export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { moment, context } = await req.json();

    const suggestion = await generateProactiveSuggestion(
      session.user.id,
      moment,
      context
    );

    return Response.json({ suggestion });
  }
  ```

- [ ] Bouton "Ask AI" dans Dashboard :
  ```tsx
  async function handleAskAI() {
    const res = await fetch('/api/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ moment: 'morning_briefing' }),
    });

    const { suggestion } = await res.json();

    toast.info(suggestion, { duration: 10000 });
  }
  ```

### 6. Integration War Room (1h)

- [ ] Dans War Room modal, afficher overload warning si charge > 20h
- [ ] Component `WarRoomWarning.tsx` :
  ```tsx
  {totalHours > maxHours && (
    <Card className="border-yellow-500 bg-yellow-50">
      <CardHeader>
        <h4 className="font-bold">⚠️ DevFlow AI Warning</h4>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{overloadWarning}</p>
      </CardContent>
    </Card>
  )}
  ```

### 7. Integration Dashboard (1h)

- [ ] Afficher morning briefing dans Dashboard header
- [ ] Component `MorningBriefingBanner.tsx` :
  ```tsx
  <Card className="bg-blue-50 border-l-4 border-blue-500">
    <CardContent className="flex items-center gap-3 p-4">
      <MessageCircle className="size-5 text-blue-500" />
      <p className="text-sm font-medium">{morningBriefing}</p>
    </CardContent>
  </Card>
  ```

### 8. Rate Limiting (1h)

- [ ] Limiter nombre de suggestions AI par user/jour
- [ ] Utiliser Upstash Rate Limit :
  ```ts
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '1 d'), // 20 suggestions/day
  });

  export async function generateProactiveSuggestion(...) {
    const { success } = await ratelimit.limit(`ai-suggest:${userId}`);

    if (!success) {
      throw new Error('Rate limit exceeded');
    }

    // ... rest of logic
  }
  ```

### 9. Tests (2h)

- [ ] Test morning briefing trigger → suggestion générée
- [ ] Test before task trigger → notification envoyée
- [ ] Test overload warning → affiché si > 20h
- [ ] Test pattern detection → insights générés
- [ ] Test escalation warning → notification avant escalade
- [ ] Test rate limiting → bloqué après 20 suggestions

---

## Critères de Succès

- [ ] Proactive suggestions fonctionnelles (6 moments)
- [ ] Cron jobs configurés (morning, before task, escalation)
- [ ] Manual triggers disponibles
- [ ] Intégration War Room + Dashboard
- [ ] Rate limiting actif (20/day)
- [ ] Notifications push envoyées
- [ ] Tests passent

---

## Design Notes

**AI Suggestions Cards :**
- Border-l-4 border-blue-500
- Background bg-blue-50
- Icon MessageCircle

**Warnings :**
- Border-l-4 border-yellow-500
- Background bg-yellow-50
- Icon AlertCircle

**Success :**
- Border-l-4 border-green-500
- Background bg-green-50
- Icon CheckCircle

---

## Prochaine tâche

Jour 4-5 : Chatbot Conversational + Function Calling
