# Phase 8 - Jour 1 : Context Management (AI)

**Durée :** 1 jour
**Statut :** 🟡 À faire
**Dépendances :** Phase 7 (CLI)

---

## Objectif

Créer le système de contexte pour DevFlow AI (accès complet aux données user).

---

## Tasks

### 1. User Context Builder (3h)

- [ ] Créer `lib/ai/context.ts`
- [ ] Function `getUserContext(userId: string)` :

  ```ts
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

    // 2. Current tasks (inbox, todo, doing)
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ["inbox", "todo", "doing"] },
      },
      orderBy: [{ priority: "desc" }, { difficulty: "desc" }],
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
      include: { task: true },
    });

    // 4. Recent reflections (last 7 days)
    const reflections = await prisma.dailyReflection.findMany({
      where: {
        userId,
        date: {
          gte: subDays(new Date(), 7),
        },
      },
      orderBy: { date: "desc" },
    });

    // 5. Stats (last 30 days)
    const stats = await calculateUserStats(
      userId,
      subDays(new Date(), 30),
      new Date(),
    );

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
        sacred: tasks.filter((t) => t.priority === "sacred").length,
        important: tasks.filter((t) => t.priority === "important").length,
        optional: tasks.filter((t) => t.priority === "optional").length,
        list: tasks.slice(0, 10).map((t) => ({
          title: t.title,
          priority: t.priority,
          difficulty: t.difficulty,
          estimatedDuration: t.estimatedDuration,
        })),
      },
      planning: {
        currentWeek: timeBlocks.map((tb) => ({
          day: format(tb.date, "EEEE"),
          time: `${tb.startTime}-${tb.endTime}`,
          task: tb.task?.title || (tb.isFree ? "Créneau libre" : null),
          priority: tb.priority,
        })),
      },
      reflections: reflections.map((r) => ({
        date: format(r.date, "yyyy-MM-dd"),
        focusQuality: r.focusQuality,
        energyLevel: r.energyLevel,
        completedTasks: r.completedTasks,
        totalTasks: r.totalTasks,
      })),
      stats: {
        avgCompletionRate: stats.avgCompletionRate,
        avgFocusQuality: stats.avgFocusQuality,
        avgEnergyLevel: stats.avgEnergyLevel,
        totalHours: stats.totalHours,
        peakHours: stats.peakHours,
        mostProductiveDay: stats.mostProductiveDay,
      },
    };
  }
  ```

### 2. Calculate User Stats (2h)

- [ ] Créer `lib/stats/calculateUserStats.ts`
- [ ] Logic :

  ```ts
  export async function calculateUserStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // 1. Get all reflections in period
    const reflections = await prisma.dailyReflection.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    if (reflections.length === 0) {
      return {
        avgCompletionRate: 0,
        avgFocusQuality: 0,
        avgEnergyLevel: 0,
        totalHours: 0,
        peakHours: null,
        mostProductiveDay: null,
      };
    }

    // 2. Calculate averages
    const avgCompletionRate =
      reflections.reduce((sum, r) => {
        const rate =
          r.totalTasks > 0 ? (r.completedTasks / r.totalTasks) * 100 : 0;
        return sum + rate;
      }, 0) / reflections.length;

    const avgFocusQuality =
      reflections.reduce((sum, r) => sum + r.focusQuality, 0) /
      reflections.length;

    const avgEnergyLevel =
      reflections.reduce((sum, r) => sum + r.energyLevel, 0) /
      reflections.length;

    // 3. Total hours (from time blocks)
    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        isFree: false,
      },
    });

    const totalMinutes = timeBlocks.reduce((sum, tb) => {
      return sum + calculateDuration(tb.startTime, tb.endTime);
    }, 0);

    const totalHours = totalMinutes / 60;

    // 4. Peak hours (most productive time slots)
    const hourStats = new Map<string, { count: number; avgFocus: number }>();

    timeBlocks.forEach((tb) => {
      const hour = tb.startTime.split(":")[0];
      const reflection = reflections.find((r) => isSameDay(r.date, tb.date));

      if (!hourStats.has(hour)) {
        hourStats.set(hour, { count: 0, avgFocus: 0 });
      }

      const stat = hourStats.get(hour)!;
      stat.count++;
      if (reflection) {
        stat.avgFocus += reflection.focusQuality;
      }
    });

    const peakHour = Array.from(hourStats.entries())
      .map(([hour, stat]) => ({
        hour,
        avgFocus: stat.avgFocus / stat.count,
      }))
      .sort((a, b) => b.avgFocus - a.avgFocus)[0];

    const peakHours = peakHour
      ? `${peakHour.hour}:00-${parseInt(peakHour.hour) + 1}:00`
      : null;

    // 5. Most productive day
    const dayStats = new Map<string, { completionRate: number }>();

    reflections.forEach((r) => {
      const day = format(r.date, "EEEE");
      const rate =
        r.totalTasks > 0 ? (r.completedTasks / r.totalTasks) * 100 : 0;

      if (!dayStats.has(day)) {
        dayStats.set(day, { completionRate: 0 });
      }

      dayStats.get(day)!.completionRate += rate;
    });

    const mostProductiveDay =
      Array.from(dayStats.entries())
        .map(([day, stat]) => ({ day, rate: stat.completionRate }))
        .sort((a, b) => b.rate - a.rate)[0]?.day || null;

    return {
      avgCompletionRate: Math.round(avgCompletionRate),
      avgFocusQuality: parseFloat(avgFocusQuality.toFixed(1)),
      avgEnergyLevel: parseFloat(avgEnergyLevel.toFixed(1)),
      totalHours: Math.round(totalHours),
      peakHours,
      mostProductiveDay,
    };
  }
  ```

### 3. Context Caching (2h)

- [ ] Cache context pour éviter requêtes répétées
- [ ] Utiliser Redis (Upstash) ou cache in-memory simple

- [ ] Implementation :

  ```ts
  import { LRUCache } from "lru-cache";

  const contextCache = new LRUCache<string, any>({
    max: 100,
    ttl: 1000 * 60 * 5, // 5 minutes
  });

  export async function getUserContextCached(userId: string) {
    const cached = contextCache.get(userId);
    if (cached) return cached;

    const context = await getUserContext(userId);
    contextCache.set(userId, context);

    return context;
  }
  ```

### 4. Context Serialization (1h)

- [ ] Fonction pour serializer context en string (pour AI prompt)
- [ ] Logic :
  ```ts
  export function serializeContext(context: any): string {
    return `
  ```

# User Profile

- Name: ${context.user.name}
- Chronotype: ${context.user.chronotype}
- Work Hours: ${JSON.stringify(context.user.workHours)}
- War Room: ${context.user.warRoomSchedule.day} ${context.user.warRoomSchedule.time}

# Current Tasks (${context.tasks.total} total)

- Sacred: ${context.tasks.sacred}
- Important: ${context.tasks.important}
- Optional: ${context.tasks.optional}

Top Tasks:
${context.tasks.list.map((t) => `- ${t.title} (${t.priority}, ${t.difficulty}⭐, ${t.estimatedDuration}min)`).join('\n')}

# Current Week Planning

${context.planning.currentWeek.map((p) => `- ${p.day} ${p.time}: ${p.task || 'Free'}`).join('\n')}

# Recent Performance (Last 7 days)

${context.reflections.map((r) => `- ${r.date}: ${r.completedTasks}/${r.totalTasks} tasks, Focus ${r.focusQuality}/5, Energy ${r.energyLevel}/5`).join('\n')}

# Stats (Last 30 days)

- Avg Completion Rate: ${context.stats.avgCompletionRate}%
- Avg Focus Quality: ${context.stats.avgFocusQuality}/5
- Avg Energy Level: ${context.stats.avgEnergyLevel}/5
- Total Hours: ${context.stats.totalHours}h
- Peak Hours: ${context.stats.peakHours || 'N/A'}
- Most Productive Day: ${context.stats.mostProductiveDay || 'N/A'}
  `.trim();
  }

  ```

  ```

### 5. Tests (2h)

- [ ] Test getUserContext → retourne contexte complet
- [ ] Test calculateUserStats → stats correctes
- [ ] Test cache → pas de requêtes répétées
- [ ] Test serialization → format lisible pour AI

---

## Critères de Succès

- [ ] getUserContext() retourne contexte complet
- [ ] calculateUserStats() calcule stats correctement
- [ ] Context cached (5 min TTL)
- [ ] Serialization format lisible
- [ ] Tests passent
- [ ] Performance < 500ms

---

## Prochaine tâche

Jour 2 : AI Proactive (Suggestions + Warnings)
