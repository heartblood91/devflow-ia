# Phase 8 : DevFlow AI Proactive

**Durée :** Semaine 9 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] DevFlow AI conversationnel (contexte full)
- [ ] AI proactive (suggestions, warnings)
- [ ] Insights avancés (patterns, optimisations)
- [ ] Commandes vocales (optionnel, V2)

---

## Tasks

### 8.1 Context Management (AI)

**Durée estimée :** 6h

#### Objectif

DevFlow AI doit avoir accès au contexte complet :
- User preferences (chronotype, horaires, War Room)
- Tasks (backlog, en cours, terminées)
- Time blocks (planning semaine)
- Daily reflections (historique)
- Stats (performance patterns)

#### Implementation

- [ ] Créer `lib/ai/context.ts` :

```ts
import { prisma } from '@/lib/prisma';

export async function getUserContext(userId: string) {
  // 1. User preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      preferences: true,
    },
  });

  // 2. Current tasks
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ['inbox', 'todo', 'doing'] },
    },
    orderBy: {
      priority: 'desc',
    },
    take: 20,
  });

  // 3. Current week planning
  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = getEndOfWeek(new Date());

  const timeBlocks = await prisma.timeBlock.findMany({
    where: {
      userId,
      date: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    include: {
      task: true,
    },
  });

  // 4. Recent reflections (last 7 days)
  const reflections = await prisma.dailyReflection.findMany({
    where: {
      userId,
      date: {
        gte: subDays(new Date(), 7),
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // 5. Stats (last 30 days)
  const stats = await calculateStats(userId, subDays(new Date(), 30), new Date());

  return {
    user: {
      name: user.name,
      email: user.email,
      chronotype: user.preferences.chronotype,
      workHours: user.preferences.workHours,
      warRoomSchedule: user.preferences.warRoomSchedule,
    },
    tasks: {
      total: tasks.length,
      sacred: tasks.filter((t) => t.priority === 'sacred').length,
      important: tasks.filter((t) => t.priority === 'important').length,
      optional: tasks.filter((t) => t.priority === 'optional').length,
      list: tasks.slice(0, 10), // Top 10
    },
    planning: {
      currentWeek: timeBlocks.map((tb) => ({
        day: format(tb.date, 'EEEE'),
        time: `${tb.startTime}-${tb.endTime}`,
        task: tb.task?.title,
        priority: tb.priority,
      })),
    },
    reflections: reflections.map((r) => ({
      date: format(r.date, 'yyyy-MM-dd'),
      focusQuality: r.focusQuality,
      energyLevel: r.energyLevel,
      completedTasks: r.completedTasks,
      totalTasks: r.totalTasks,
    })),
    stats: {
      avgCompletionRate: stats.avgCompletionRate,
      avgFocusQuality: stats.avgFocusQuality,
      totalHours: stats.totalHours,
      peakHours: stats.peakHours,
      mostProductiveDay: stats.mostProductiveDay,
    },
  };
}
```

**Tests :**
- [ ] Test getUserContext → retourne contexte complet
- [ ] Test contexte sérialisable en JSON
- [ ] Test performance (< 500ms)

---

### 8.2 AI Proactive (Suggestions)

**Durée estimée :** 8h

#### Cas d'usage

1. **Morning Briefing (8h30)**
   - "Bonjour ! Voici tes priorités du jour : ..."
   - "Attention : ta première tâche est difficile (4⭐). Prends ton café avant."

2. **Before Difficult Task (15 min avant)**
   - "Dans 15 min : SEPA Backend (2h, difficile). Prêt ?"
   - "Conseil : ferme Slack pour rester focus."

3. **End of Task**
   - "SEPA Backend terminé. Bien joué !"
   - "Prochaine : Bug fix dons (16h-18h). Tu peux prendre 5 min de pause avant."

4. **Overload Warning (War Room)**
   - "⚠️ Charge trop élevée : 22h/20h. Retire 2h de tâches ou réduis les estimations."

5. **Pattern Detection**
   - "J'ai remarqué : tu es plus productif le matin (10h-12h). Continue à placer tes tâches difficiles là."
   - "Attention : 3 fois cette semaine, tu as débordé sur les créneaux secours. Prévois plus de buffer."

6. **Recurring Task Escalation**
   - "⚠️ Veille techno : skipée 3 fois. Elle escalade demain (Sacré, 14h)."

#### Implementation

- [ ] Créer `lib/ai/proactive.ts` :

```ts
const PROACTIVE_PROMPT = `Tu es DevFlow AI, un assistant proactif pour développeurs.

Ton rôle : analyser le contexte user et générer des suggestions, warnings, insights pertinents.

Contexte user :
{context}

Moment : {moment} (morning_briefing / before_task / end_task / overload_warning / pattern_detection)

Ton style :
- Concis (max 2-3 phrases)
- Actionnable (conseils concrets)
- Friendly (pas robotique)
- Dev-oriented (parle leur langage)

Exemples :

Morning Briefing :
"Salut ! Aujourd'hui : 3 tâches (1 difficile). Ton pic : 10h-12h. Commence par SEPA Backend."

Before Task :
"Dans 15 min : SEPA Backend (2h, difficile). Ferme Slack et active le timer."

End Task :
"SEPA Backend terminé. Bien joué ! Prochaine : Bug fix (16h). Prends 5 min de pause."

Overload Warning :
"⚠️ Charge trop élevée : 22h/20h. Retire 2h de tâches ou réduis les estimations."

Pattern Detection :
"Tu es plus productif le matin (10h-12h, focus 4.5/5). Continue à placer tes tâches difficiles là."

Génère une suggestion/warning pertinente basée sur le contexte.`;

export async function generateProactiveSuggestion(
  userId: string,
  moment: 'morning_briefing' | 'before_task' | 'end_task' | 'overload_warning' | 'pattern_detection',
  additionalContext?: any
) {
  const context = await getUserContext(userId);

  const prompt = PROACTIVE_PROMPT
    .replace('{context}', JSON.stringify(context, null, 2))
    .replace('{moment}', moment);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  return completion.choices[0].message.content;
}
```

#### Trigger Logic

- [ ] Créer `lib/ai/triggers.ts` :

```ts
export async function triggerMorningBriefing(userId: string) {
  const suggestion = await generateProactiveSuggestion(userId, 'morning_briefing');

  await sendNotification(userId, {
    title: 'Morning Briefing',
    body: suggestion,
    type: 'morning_briefing',
  });
}

export async function triggerBeforeTask(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  const suggestion = await generateProactiveSuggestion(userId, 'before_task', { task });

  await sendNotification(userId, {
    title: 'Tâche à venir',
    body: suggestion,
    type: 'before_task',
  });
}

// Similar for end_task, overload_warning, pattern_detection
```

**Tests :**
- [ ] Test morning briefing → suggestion générée
- [ ] Test before task → warning si difficile
- [ ] Test overload warning → détecte charge > 20h
- [ ] Test pattern detection → détecte peak hours

---

### 8.3 Advanced Insights

**Durée estimée :** 6h

#### Weekly Insights

- [ ] Créer `lib/ai/insights.ts` :

```ts
const WEEKLY_INSIGHTS_PROMPT = `Tu es DevFlow AI. Analyse les stats de la semaine et génère 3-5 insights actionnables.

Stats :
{stats}

Reflections :
{reflections}

Ton style : concis, actionnable, friendly, dev-oriented.

Catégories d'insights :
1. Productivity Patterns (peak hours, best days, etc.)
2. Time Estimation (sous/sur-estimation)
3. Task Prioritization (too many sacred/important, etc.)
4. Energy Management (energy vs focus quality correlation)
5. Buffer Usage (rescue slots, free slots)

Exemples :

"Tu es plus productif le mardi (focus 4.5/5, 90% completion). Planifie tes tâches difficiles ce jour-là."

"Tu sous-estimes systématiquement (-20% en moyenne). Multiplie tes estimations par 1.2."

"Tu utilises 2/2 créneaux secours chaque semaine. Augmente ton buffer à 25%."

"Focus quality corrélé à energy level (r=0.85). Dors plus pour être plus focus."

"3 semaines consécutives : tu skipes les tâches facultatives. Retire-les du planning si pas importantes."

Génère 3-5 insights (max 2 lignes chacun).`;

export async function generateWeeklyInsights(userId: string, weekStartDate: Date) {
  const stats = await calculateWeeklyStats(userId, weekStartDate);
  const reflections = await prisma.dailyReflection.findMany({
    where: {
      userId,
      date: {
        gte: weekStartDate,
        lt: addDays(weekStartDate, 7),
      },
    },
  });

  const prompt = WEEKLY_INSIGHTS_PROMPT
    .replace('{stats}', JSON.stringify(stats, null, 2))
    .replace('{reflections}', JSON.stringify(reflections, null, 2));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.7,
    max_tokens: 400,
  });

  return completion.choices[0].message.content;
}
```

#### Monthly Insights

- [ ] Similar logic, mais avec données sur 30 jours
- [ ] Détection trends long-terme :
  - Burnout risk (rescue slots > 80% utilisés)
  - Productivity decline (completion rate diminue)
  - Optimal week structure (quel jour pour War Room, etc.)

**Tests :**
- [ ] Test weekly insights → 3-5 insights générés
- [ ] Test monthly insights → trends long-terme détectés
- [ ] Test insights pertinents (basés sur vraies données)

---

### 8.4 Conversational AI (Enhanced)

**Durée estimée :** 4h

#### Upgrade Chatbot

- [ ] Ajouter function calling (OpenAI Tools) :

```ts
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_next_task',
      description: 'Get the next task for the user',
      parameters: {},
    },
  },
  {
    type: 'function',
    function: {
      name: 'move_task',
      description: 'Move a task to another day',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'The task ID' },
          newDate: { type: 'string', description: 'The new date (YYYY-MM-DD)' },
        },
        required: ['taskId', 'newDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weekly_stats',
      description: 'Get weekly productivity stats',
      parameters: {},
    },
  },
];

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...conversationHistory],
  tools,
});

if (completion.choices[0].message.tool_calls) {
  const toolCall = completion.choices[0].message.tool_calls[0];

  if (toolCall.function.name === 'get_next_task') {
    const nextTask = await getNextTask(userId);
    return `Prochaine tâche : ${nextTask.title} (${nextTask.startTime}-${nextTask.endTime})`;
  }

  if (toolCall.function.name === 'move_task') {
    const { taskId, newDate } = JSON.parse(toolCall.function.arguments);
    await moveTask(taskId, newDate);
    return `Tâche déplacée au ${newDate}.`;
  }

  if (toolCall.function.name === 'get_weekly_stats') {
    const stats = await getWeeklyStats(userId);
    return `Stats semaine : ${stats.completedTasks}/${stats.totalTasks} tâches, ${stats.totalHours}h.`;
  }
}
```

**Tests :**
- [ ] Test "Quelle est ma prochaine tâche ?" → function call
- [ ] Test "Déplace SEPA à demain" → task moved
- [ ] Test "Montre mes stats" → stats affichées

---

## Critères de Succès

- [ ] DevFlow AI a accès au contexte complet
- [ ] AI proactive génère suggestions pertinentes
- [ ] Weekly/monthly insights générés
- [ ] Chatbot avec function calling fonctionnel
- [ ] Notifications push intégrées
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 9 (Features Avancées)

---

## Risques

**Risque 1 : AI suggestions non pertinentes**
- **Impact :** User ignore AI
- **Mitigation :** Feedback loop, fine-tuning prompt

**Risque 2 : Cost OpenAI élevé**
- **Impact :** Budget exceeded
- **Mitigation :** Caching context, rate limiting

**Risque 3 : Notifications trop intrusives**
- **Impact :** User désactive
- **Mitigation :** User peut configurer fréquence

---

## Notes

- AI doit être helpful, pas annoying
- Suggestions basées sur données réelles (pas bullshit)
- Focus sur actionnabilité (conseils concrets)

---

**Prochaine phase :** Phase 9 - Features Avancées
