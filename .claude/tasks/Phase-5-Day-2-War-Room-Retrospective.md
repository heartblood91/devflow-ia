# Phase 5 - Jour 2 : War Room Modal (Rétrospective)

**Durée :** 1 jour
**Statut :** 🟡 À faire
**Dépendances :** Jour 1 (Weekly View)

---

## Objectif

Créer la partie rétrospective de la War Room (stats semaine passée + AI insights).

---

## Tasks

### 1. War Room Modal Structure (2h)

- [ ] Créer `components/weekly/WarRoomModal.tsx`
- [ ] shadcn Dialog (max-w-6xl, fullscreen sur mobile)
- [ ] Layout 2 colonnes :
  ```tsx
  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <div>{/* Rétrospective */}</div>
    <div>{/* Planification (Jour 3) */}</div>
  </div>
  ```
- [ ] Header : "War Room - Semaine du X"
- [ ] Footer : Boutons "Annuler" | "Générer Planning" | "Confirmer"

### 2. Trigger War Room (1h)

- [ ] Bouton "War Room" dans WeeklyHeader
- [ ] Notification vendredi 16h45 (Phase 9, pour l'instant bouton manuel)
- [ ] State `isWarRoomOpen` (useState)
- [ ] onClick → ouvre modal

### 3. Rétrospective Stats (3h)

- [ ] Créer `components/weekly/RetrospectiveStats.tsx`
- [ ] Server Action : `getLastWeekStats(userId, weekStartDate)`
- [ ] Calculer :
  - Tasks complétées : `8/12 (67%)`
  - Temps total : `18h/20h`
  - Créneaux secours utilisés : `1/2`
  - Tasks skippées : `4`
  - Focus quality moyen : `4.2/5` (depuis daily reflections)
  - Energy level moyen : `3.8/5`

- [ ] Affichage :
  ```tsx
  <Card>
    <CardHeader>
      <h3>Rétrospective Semaine Passée</h3>
    </CardHeader>
    <CardContent>
      <div className="stats-grid">
        <StatCard
          icon={CheckCircle}
          label="Tâches complétées"
          value="8/12"
          percentage={67}
          variant="success"
        />
        <StatCard
          icon={Clock}
          label="Temps total"
          value="18h/20h"
          percentage={90}
          variant="info"
        />
        <StatCard
          icon={Flame}
          label="Créneaux secours"
          value="1/2"
          percentage={50}
          variant="warning"
        />
        <StatCard
          icon={AlertCircle}
          label="Tasks skippées"
          value="4"
          variant="error"
        />
        <StatCard
          icon={Target}
          label="Focus quality"
          value="4.2/5"
          percentage={84}
          variant="success"
        />
        <StatCard
          icon={Battery}
          label="Energy level"
          value="3.8/5"
          percentage={76}
          variant="info"
        />
      </div>
    </CardContent>
  </Card>
  ```

### 4. StatCard Component (1h)

- [ ] Créer `components/weekly/StatCard.tsx`
- [ ] Props : `icon`, `label`, `value`, `percentage?`, `variant`
- [ ] Design brutal :
  - Border épaisse (2px)
  - Icon grande (size-8)
  - Value en gros (text-3xl font-bold)
  - Label en petit (text-sm uppercase)
  - Couleur border selon variant :
    - success : border-green-500
    - info : border-blue-500
    - warning : border-yellow-500
    - error : border-red-500

### 5. Server Action : Calculate Stats (2h)

- [ ] Créer `lib/stats/calculateWeeklyStats.ts`
- [ ] Logic :

  ```ts
  export async function calculateWeeklyStats(
    userId: string,
    weekStartDate: Date,
  ) {
    const weekEnd = addDays(weekStartDate, 7);

    // 1. Tasks complétées
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        completedAt: { gte: weekStartDate, lt: weekEnd },
      },
    });
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalTasks = tasks.length;

    // 2. Temps total
    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId,
        date: { gte: weekStartDate, lt: weekEnd },
        isFree: false,
        isRescue: false,
      },
    });
    const totalMinutes = timeBlocks.reduce((sum, tb) => {
      return sum + calculateDuration(tb.startTime, tb.endTime);
    }, 0);
    const totalHours = totalMinutes / 60;

    // 3. Créneaux secours
    const rescueBlocks = await prisma.timeBlock.findMany({
      where: {
        userId,
        date: { gte: weekStartDate, lt: weekEnd },
        isRescue: true,
        isFree: false, // Used
      },
    });
    const rescueUsed = rescueBlocks.length;

    // 4. Tasks skippées
    const skippedTasks = totalTasks - completedTasks;

    // 5. Focus quality (moyenne daily reflections)
    const reflections = await prisma.dailyReflection.findMany({
      where: {
        userId,
        date: { gte: weekStartDate, lt: weekEnd },
      },
    });
    const avgFocusQuality =
      reflections.reduce((sum, r) => sum + r.focusQuality, 0) /
        reflections.length || 0;
    const avgEnergyLevel =
      reflections.reduce((sum, r) => sum + r.energyLevel, 0) /
        reflections.length || 0;

    return {
      completedTasks,
      totalTasks,
      totalHours,
      maxHours: 20,
      rescueUsed,
      rescueMax: 2,
      skippedTasks,
      avgFocusQuality,
      avgEnergyLevel,
    };
  }
  ```

### 6. AI Insights (3h)

- [ ] Créer `components/weekly/DevFlowAIInsights.tsx`
- [ ] Server Action : `generateWeeklyInsights(stats)`
- [ ] Prompt GPT-4o-mini :

  ```ts
  const INSIGHTS_PROMPT = `Tu es DevFlow AI. Analyse les stats de la semaine passée et donne 3 insights actionnables.
  
  Stats :
  - Tâches complétées : ${stats.completedTasks}/${stats.totalTasks} (${percentage}%)
  - Temps total : ${stats.totalHours}h/${stats.maxHours}h
  - Créneaux secours : ${stats.rescueUsed}/${stats.rescueMax}
  - Focus quality : ${stats.avgFocusQuality.toFixed(1)}/5
  - Energy level : ${stats.avgEnergyLevel.toFixed(1)}/5
  - Tasks skippées : ${stats.skippedTasks}
  
  Ton style : concis, actionnable, friendly, dev-oriented, pas de bullshit.
  
  Exemples :
  - "Belle semaine ! 8/12 tâches terminées. Tu as bien géré la charge."
  - "Tu utilises trop de créneaux secours (2/2). Prévois plus de buffer (25% au lieu de 20%)."
  - "Focus quality élevé (4.2/5). Continue à placer tes tâches difficiles sur tes peaks."
  - "Energy level bas (3.8/5). Dors plus ou réduis la charge."
  
  Génère 3 insights (max 2 lignes chacun). Format :
  1. [Insight 1]
  2. [Insight 2]
  3. [Insight 3]`;
  ```

- [ ] Call OpenAI :

  ```ts
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  });
  ```

- [ ] Afficher insights :
  ```tsx
  <Card>
    <CardHeader>
      <h3>DevFlow AI Insights</h3>
    </CardHeader>
    <CardContent>
      <div className="insights-list">
        {insights
          .split("\n")
          .filter(Boolean)
          .map((insight, i) => (
            <div key={i} className="insight-item">
              <MessageCircle className="size-5 text-blue-500" />
              <p>{insight.replace(/^\d+\.\s*/, "")}</p>
            </div>
          ))}
      </div>
    </CardContent>
  </Card>
  ```

### 7. Tests (2h)

- [ ] Test modal ouvre/ferme
- [ ] Test stats calculées correctement
- [ ] Test AI insights générés
- [ ] Test affichage responsive (2 cols → 1 col sur mobile)
- [ ] Test loading states (stats + AI)

---

## Critères de Succès

- [ ] War Room modal s'ouvre
- [ ] Rétrospective affiche stats semaine passée
- [ ] AI génère 3 insights pertinents
- [ ] Design brutal/minimal respecté
- [ ] Responsive

---

## Design Notes

**War Room Modal :**

- Background : bg-white dark:bg-gray-950
- Border modale : border-4 border-black
- Close button : X en haut-droite, gros (size-6)

**Stats Grid :**

- 3 cols desktop, 2 cols tablet, 1 col mobile
- Gap-4 entre cards
- StatCard : border-2, pas de shadow, hover:border-4

**AI Insights :**

- Border-l-4 border-blue-500 (accent)
- Background gris très clair (bg-gray-50)
- Icon MessageCircle en bleu
- Text simple, pas de fancy formatting

---

## Prochaine tâche

Jour 3 : War Room Modal (Planification)
