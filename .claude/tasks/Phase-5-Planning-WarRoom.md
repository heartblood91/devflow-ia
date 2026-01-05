# Phase 5 : Planning + War Room

**Durée :** Semaine 5-6 (10 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Créer Weekly View (calendrier semaine)
- [ ] Implémenter War Room (modal vendredi)
- [ ] Algorithme de planification intelligent (chronotype-based)
- [ ] Drag & drop tasks → time blocks
- [ ] Validation charge (max 20h/semaine)
- [ ] Créneaux libres (20% buffer)
- [ ] Créneaux secours tracking

---

## Tasks

### 5.1 Weekly View (Calendrier Semaine)

**Durée estimée :** 8h

#### Structure

- [ ] Créer `app/weekly/page.tsx` :
  - Header : Semaine du [date] - [date]
  - Navigation : Semaine précédente / suivante
  - Calendrier : 7 jours (lun-dim)
  - Time blocks affichés par jour
  - Sidebar : liste tasks planifiées

#### Layout

```tsx
<div className="weekly-view">
  <WeeklyHeader currentWeek={currentWeek} onNavigate={handleNavigate} />

  <div className="grid grid-cols-8 gap-2">
    {/* Colonne 1 : Horaires */}
    <div className="col-span-1">
      {hours.map((hour) => (
        <div key={hour} className="hour-label">{hour}</div>
      ))}
    </div>

    {/* Colonnes 2-8 : Jours */}
    {daysOfWeek.map((day) => (
      <DayColumn
        key={day}
        day={day}
        timeBlocks={timeBlocks.filter((tb) => tb.date === day)}
        workHours={workHours[day]}
      />
    ))}
  </div>

  <WeeklySidebar tasks={plannedTasks} />
</div>
```

#### Time Blocks Display

- [ ] Créer `components/weekly/TimeBlock.tsx` :

```tsx
type TimeBlockProps = {
  block: TimeBlock;
  onClick: () => void;
};

function TimeBlock({ block, onClick }: TimeBlockProps) {
  const bgColor = {
    sacred: 'bg-red-500',
    important: 'bg-orange-500',
    optional: 'bg-green-500',
    buffer: 'bg-gray-100',
    rescue: 'bg-yellow-400',
  }[block.priority || 'buffer'];

  return (
    <div
      className={`time-block ${bgColor} ${block.isFree ? 'border-dashed' : ''}`}
      style={{
        height: `${block.duration}px`, // 1 min = 1px
        top: `${block.offsetFromTop}px`,
      }}
      onClick={onClick}
    >
      {block.taskTitle && (
        <div className="task-title">{block.taskTitle}</div>
      )}

      {block.isFree && (
        <div className="free-slot">⚪ Créneau libre</div>
      )}

      {block.isRescue && (
        <div className="rescue-slot">⚠️ Secours ({block.rescueReason})</div>
      )}

      <div className="time-range">
        {block.startTime} - {block.endTime}
      </div>
    </div>
  );
}
```

**Tests :**
- [ ] Test affichage semaine courante
- [ ] Test navigation semaine précédente/suivante
- [ ] Test time blocks affichés correctement
- [ ] Test calcul height/top selon durée

---

### 5.2 War Room Modal

**Durée estimée :** 10h

#### Déclenchement

- [ ] Notification vendredi 16h45 : "War Room dans 15 min"
- [ ] User clique → ouvre modal War Room
- [ ] Ou : User peut cliquer bouton "War Room" manuellement

#### Modal Structure

- [ ] Créer `components/weekly/WarRoomModal.tsx` :

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-6xl">
    <DialogHeader>
      <DialogTitle>War Room - Planification Semaine Prochaine</DialogTitle>
    </DialogHeader>

    <div className="grid grid-cols-2 gap-4">
      {/* Colonne 1 : Rétrospective */}
      <div>
        <h3>Rétrospective Semaine Passée</h3>
        <RetrospectiveStats stats={lastWeekStats} />
        <DevFlowAIInsights insights={aiInsights} />
      </div>

      {/* Colonne 2 : Planification */}
      <div>
        <h3>Planifier la Semaine Prochaine</h3>
        <BacklogTasks tasks={backlogTasks} />
        <WeeklyPlanning timeBlocks={nextWeekBlocks} />
      </div>
    </div>

    <div className="footer">
      <ChargeValidation totalHours={totalHours} maxHours={20} />
      <Button onClick={handleGenerate}>Générer Planning</Button>
      <Button onClick={handleConfirm}>Confirmer Planning</Button>
    </div>
  </DialogContent>
</Dialog>
```

#### Rétrospective (Colonne 1)

- [ ] Créer `components/weekly/RetrospectiveStats.tsx` :
  - Tâches complétées : 8/12 (67%)
  - Temps total : 18h/20h
  - Créneaux secours utilisés : 1/2
  - Tasks skippées : 4
  - Focus quality moyen : 4.2/5

- [ ] Créer `components/weekly/DevFlowAIInsights.tsx` :
  - AI génère insights basés sur stats
  - Exemple :
    - "Tu as skipé 3 tâches importantes cette semaine. Essaie de réduire la charge."
    - "Ton pic de productivité : 10h-12h. Continue comme ça."
    - "Tâche 'SEPA Backend' : 2h de plus que prévu. Sous-estime moins."

**Server Action : Générer Insights**

```ts
'use server';

import { openai } from '@/lib/openai';

const INSIGHTS_PROMPT = `Tu es DevFlow AI. Analyse les stats de la semaine passée et donne 3 insights actionnables.

Stats :
- Tâches complétées : {completedTasks}/{totalTasks}
- Temps total : {totalHours}h/{maxHours}h
- Créneaux secours : {rescueUsed}/{rescueMax}
- Focus quality : {focusQuality}/5
- Tasks skippées : {skippedTasks}

Ton style : concis, actionnable, friendly, dev-oriented.

Exemples :
- "Tu as skipé 3 tâches importantes. Réduis la charge ou augmente la difficulté estimée."
- "Ton pic : 10h-12h. Garde tes tâches difficiles là."
- "Tu utilises trop de créneaux secours (2/2). Prévois plus de buffer."

Génère 3 insights (max 2 lignes chacun).`;

export async function generateInsights(stats: WeeklyStats) {
  const prompt = INSIGHTS_PROMPT
    .replace('{completedTasks}', stats.completedTasks.toString())
    .replace('{totalTasks}', stats.totalTasks.toString())
    .replace('{totalHours}', stats.totalHours.toString())
    .replace('{maxHours}', stats.maxHours.toString())
    .replace('{rescueUsed}', stats.rescueUsed.toString())
    .replace('{rescueMax}', stats.rescueMax.toString())
    .replace('{focusQuality}', stats.focusQuality.toString())
    .replace('{skippedTasks}', stats.skippedTasks.toString());

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  });

  return completion.choices[0].message.content;
}
```

#### Planification (Colonne 2)

- [ ] Créer `components/weekly/BacklogTasks.tsx` :
  - Liste tasks Backlog (colonne "À faire")
  - Filtré : priorité Sacré et Important uniquement
  - Drag & drop vers Weekly Planning

- [ ] Créer `components/weekly/WeeklyPlanning.tsx` :
  - Mini calendrier semaine (lun-dim)
  - Drop zones pour chaque jour/créneau
  - Affiche tasks déjà planifiées

**Drag & Drop Logic :**

```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (!over) return;

  const taskId = active.id as string;
  const targetSlot = over.id as string; // "monday-10h" etc.

  const [day, time] = targetSlot.split('-');

  // Créer time block
  await createTimeBlock({
    taskId,
    day,
    startTime: time,
    // endTime calculé automatiquement selon task.estimatedDuration
  });

  // Retirer task de backlog (update status → "todo")
}
```

#### Validation Charge

- [ ] Créer `components/weekly/ChargeValidation.tsx` :
  - Calcul temps total planifié
  - Affiche : "18h/20h (90%)" → Vert
  - Si > 20h : "22h/20h (110%)" → Rouge + warning
  - Warning : "⚠️ Charge trop élevée. Retire 2h de tâches."

**Server Action : Calculer Charge**

```ts
'use server';

export async function calculateWeeklyCharge(timeBlocks: TimeBlock[]) {
  const totalMinutes = timeBlocks
    .filter((tb) => !tb.isFree && !tb.isRescue)
    .reduce((sum, tb) => {
      const start = parseTime(tb.startTime);
      const end = parseTime(tb.endTime);
      return sum + (end - start);
    }, 0);

  const totalHours = totalMinutes / 60;
  const maxHours = 20;
  const percentage = (totalHours / maxHours) * 100;

  return {
    totalHours,
    maxHours,
    percentage,
    isOverloaded: totalHours > maxHours,
  };
}
```

---

### 5.3 Algorithme de Planification Intelligent

**Durée estimée :** 12h

#### Objectif

Générer planning hebdomadaire optimal basé sur :
- Chronotype (peak hours)
- Priorité (Sacré en premier)
- Difficulté (tâches difficiles sur peak hours)
- Durée estimée
- Dépendances
- 20% buffer time
- 2 créneaux secours/semaine

#### Algorithm Pseudo-code

```
1. Récupérer user preferences (chronotype, workHours, warRoomSchedule)
2. Récupérer tasks backlog (status "todo", priorité Sacré + Important)
3. Trier tasks :
   - Sacré > Important
   - Difficulté 5 > 4 > 3 > 2 > 1
   - Deadline proche > deadline lointaine
4. Pour chaque jour (lun-dim) :
   a. Calculer horaires travail (workHours[day])
   b. Identifier peak hours (basé sur chronotype)
   c. Placer tâches difficiles (4-5) sur peak hours
   d. Placer tâches moyennes (3) sur heures normales
   e. Placer tâches simples (1-2) sur heures basses
   f. Ajouter 20% buffer time (créneaux libres)
5. Ajouter 2 créneaux secours (vendredi après-midi par défaut)
6. Vérifier dépendances (task B après task A)
7. Retourner time blocks générés
```

#### Implementation

- [ ] Créer `packages/core/src/usecases/GenerateWeeklyPlanning.ts` :

```ts
type GenerateWeeklyPlanningInput = {
  userId: string;
  weekStartDate: Date;
};

type GenerateWeeklyPlanningOutput = {
  timeBlocks: TimeBlock[];
  totalHours: number;
  bufferHours: number;
  rescueSlots: number;
};

export class GenerateWeeklyPlanningUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository: IUserRepository,
    private timeBlockRepository: ITimeBlockRepository
  ) {}

  async execute(input: GenerateWeeklyPlanningInput): Promise<GenerateWeeklyPlanningOutput> {
    // 1. Get user preferences
    const user = await this.userRepository.findById(input.userId);
    const { chronotype, workHours, bufferPercentage, maxRescuePerWeek } = user.preferences;

    // 2. Get tasks to plan
    const tasks = await this.taskRepository.findByUserId(input.userId, {
      status: 'todo',
      priority: ['sacred', 'important'],
    });

    // 3. Sort tasks by priority, difficulty, deadline
    const sortedTasks = this.sortTasks(tasks);

    // 4. Generate time blocks for each day
    const timeBlocks: TimeBlock[] = [];
    const daysOfWeek = this.getWeekDays(input.weekStartDate);

    for (const day of daysOfWeek) {
      const dayWorkHours = workHours[day.weekday]; // { start: "08:00", end: "19:00" }
      if (!dayWorkHours) continue; // Day off

      const peakHours = this.getPeakHours(chronotype, day.weekday);

      const dayBlocks = this.planDay({
        day: day.date,
        workHours: dayWorkHours,
        peakHours,
        tasks: sortedTasks,
        bufferPercentage,
      });

      timeBlocks.push(...dayBlocks);
    }

    // 5. Add rescue slots (vendredi après-midi)
    const rescueSlots = this.addRescueSlots(timeBlocks, daysOfWeek, maxRescuePerWeek);
    timeBlocks.push(...rescueSlots);

    // 6. Validate dependencies
    const validatedBlocks = this.validateDependencies(timeBlocks, tasks);

    // 7. Save to DB
    await this.timeBlockRepository.bulkCreate(validatedBlocks);

    return {
      timeBlocks: validatedBlocks,
      totalHours: this.calculateTotalHours(validatedBlocks),
      bufferHours: this.calculateBufferHours(validatedBlocks),
      rescueSlots: rescueSlots.length,
    };
  }

  private sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // Priority
      const priorityOrder = { sacred: 3, important: 2, optional: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // Difficulty
      if (a.difficulty !== b.difficulty) {
        return b.difficulty - a.difficulty;
      }

      // Deadline (closest first)
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime();
      }

      return 0;
    });
  }

  private getPeakHours(chronotype: string, weekday: string): { start: string; end: string }[] {
    const peakHoursMap = {
      bear: [{ start: '10:00', end: '12:00' }, { start: '16:00', end: '18:00' }],
      lion: [{ start: '08:00', end: '10:00' }, { start: '14:00', end: '16:00' }],
      wolf: [{ start: '16:00', end: '18:00' }, { start: '20:00', end: '22:00' }],
      dolphin: [{ start: '10:00', end: '12:00' }], // Variable
    };

    return peakHoursMap[chronotype] || peakHoursMap.bear;
  }

  private planDay(options: {
    day: Date;
    workHours: { start: string; end: string };
    peakHours: { start: string; end: string }[];
    tasks: Task[];
    bufferPercentage: number;
  }): TimeBlock[] {
    const blocks: TimeBlock[] = [];

    // Calculate total available minutes
    const totalMinutes = this.calculateMinutes(options.workHours.start, options.workHours.end);
    const bufferMinutes = Math.floor(totalMinutes * (options.bufferPercentage / 100));
    const taskMinutes = totalMinutes - bufferMinutes;

    let currentTime = options.workHours.start;
    let remainingTaskMinutes = taskMinutes;

    // Place difficult tasks on peak hours first
    for (const peakHour of options.peakHours) {
      const difficultTasks = options.tasks.filter((t) => t.difficulty >= 4 && !t.planned);

      for (const task of difficultTasks) {
        if (remainingTaskMinutes <= 0) break;

        const duration = Math.min(task.estimatedDuration, remainingTaskMinutes);

        blocks.push({
          date: options.day,
          startTime: currentTime,
          endTime: this.addMinutes(currentTime, duration),
          type: 'deep_work',
          priority: task.priority,
          taskId: task.id,
          taskTitle: task.title,
        });

        currentTime = this.addMinutes(currentTime, duration);
        remainingTaskMinutes -= duration;
        task.planned = true;
      }
    }

    // Place medium/easy tasks on remaining hours
    const remainingTasks = options.tasks.filter((t) => !t.planned);

    for (const task of remainingTasks) {
      if (remainingTaskMinutes <= 0) break;

      const duration = Math.min(task.estimatedDuration, remainingTaskMinutes);

      blocks.push({
        date: options.day,
        startTime: currentTime,
        endTime: this.addMinutes(currentTime, duration),
        type: 'shallow_work',
        priority: task.priority,
        taskId: task.id,
        taskTitle: task.title,
      });

      currentTime = this.addMinutes(currentTime, duration);
      remainingTaskMinutes -= duration;
      task.planned = true;
    }

    // Add buffer time (free slots)
    blocks.push({
      date: options.day,
      startTime: currentTime,
      endTime: this.addMinutes(currentTime, bufferMinutes),
      type: 'buffer',
      isFree: true,
    });

    return blocks;
  }

  private addRescueSlots(
    timeBlocks: TimeBlock[],
    daysOfWeek: { date: Date; weekday: string }[],
    maxRescue: number
  ): TimeBlock[] {
    const rescueSlots: TimeBlock[] = [];

    // Default: vendredi 16h-18h
    const friday = daysOfWeek.find((d) => d.weekday === 'friday');

    if (friday && maxRescue > 0) {
      rescueSlots.push({
        date: friday.date,
        startTime: '16:00',
        endTime: '18:00',
        type: 'rescue',
        isRescue: true,
        isFree: true,
      });
    }

    return rescueSlots.slice(0, maxRescue);
  }

  // Helper methods: calculateMinutes, addMinutes, validateDependencies, etc.
}
```

**Tests :**
- [ ] Test génération planning → time blocks créés
- [ ] Test tâches difficiles → peak hours
- [ ] Test buffer time → 20% du temps total
- [ ] Test rescue slots → 2 créneaux vendredi
- [ ] Test dépendances → task B après task A
- [ ] Test overload → warning si > 20h

---

### 5.4 Confirmation et Sauvegarde

**Durée estimée :** 3h

#### Flow

1. User clique "Générer Planning" → algorithm s'exécute
2. Affiche preview planning (Weekly View dans modal)
3. User peut drag & drop pour ajuster
4. User clique "Confirmer Planning"
5. Time blocks sauvegardés en DB
6. Redirect vers /weekly (affiche semaine planifiée)
7. Toast : "Semaine planifiée ✓"

**Server Action : Confirmer Planning**

```ts
'use server';

export async function confirmWeeklyPlanning(timeBlocks: TimeBlock[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Save all time blocks
  await prisma.timeBlock.createMany({
    data: timeBlocks.map((tb) => ({
      userId: session.user.id,
      ...tb,
    })),
  });

  // Update tasks status → "todo" (planifiées)
  const taskIds = timeBlocks.filter((tb) => tb.taskId).map((tb) => tb.taskId);
  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: { status: 'todo' },
  });

  return { success: true };
}
```

**Tests :**
- [ ] Test confirm → time blocks saved
- [ ] Test tasks status → "todo"
- [ ] Test redirect → /weekly

---

## Critères de Succès

- [ ] Weekly View affiche semaine courante
- [ ] War Room modal fonctionnelle (rétrospective + planification)
- [ ] Algorithme génère planning intelligent
- [ ] Drag & drop tasks → time blocks
- [ ] Validation charge (max 20h)
- [ ] Buffer time (20%) et rescue slots (2) ajoutés
- [ ] Confirmation sauvegarde planning en DB
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 6 (Execution + Reflection)

---

## Risques

**Risque 1 : Algorithme trop simpliste**
- **Impact :** Planning pas optimal, user frustré
- **Mitigation :** Itérer sur algorithm, ajouter feedback loop

**Risque 2 : Drag & drop complexe (dépendances)**
- **Impact :** Bugs, tasks hors ordre
- **Mitigation :** Validation côté serveur, warnings visuels

**Risque 3 : AI insights non pertinents**
- **Impact :** User ignore les insights
- **Mitigation :** Prompt engineering, exemples concrets

---

## Notes

- War Room doit être rapide (< 10 min)
- Planning généré modifiable (user garde contrôle)
- Focus sur peak hours (impact majeur)

---

**Prochaine phase :** Phase 6 - Execution + Daily Reflection
