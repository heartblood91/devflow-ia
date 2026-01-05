# Phase 5 - Jour 3-4 : War Room Planification + Algorithme

**Durée :** 2 jours
**Statut :** 🟡 À faire
**Dépendances :** Jour 2 (Rétrospective)

---

## Objectif

Implémenter la partie planification de la War Room : drag & drop tasks + algorithme intelligent.

---

## Jour 3 : UI Planification (8h)

### 1. Colonne Planification (2h)

- [ ] Ajouter dans War Room modal (colonne droite)
- [ ] Header : "Planifier la Semaine Prochaine"
- [ ] 2 sections :
  - Backlog Tasks (draggable)
  - Weekly Planning Preview (drop zones)

### 2. Backlog Tasks List (2h)

- [ ] Créer `components/weekly/BacklogTasksList.tsx`
- [ ] Fetch tasks :
  ```ts
  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: 'todo',
      kanbanColumn: 'todo',
      priority: { in: ['sacred', 'important'] }, // Pas les optional
    },
    orderBy: [
      { priority: 'desc' },
      { difficulty: 'desc' },
      { deadline: 'asc' },
    ],
  });
  ```
- [ ] Afficher en liste verticale
- [ ] Chaque task = mini TaskCard (draggable)
- [ ] Afficher : priorité, titre, difficulté, durée estimée

### 3. Weekly Planning Preview (3h)

- [ ] Créer `components/weekly/WeeklyPlanningPreview.tsx`
- [ ] Mini calendrier 7 jours (lun-dim)
- [ ] Pour chaque jour :
  - Afficher horaires travail (ex: 8h-19h)
  - Time slots (1h intervals)
  - Drop zones pour drag & drop

- [ ] Design compact :
  ```tsx
  <div className="planning-preview">
    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
      <div key={day} className="day-column">
        <h4>{day}</h4>
        <div className="time-slots">
          {timeSlots.map((slot) => (
            <DropZone
              key={slot.time}
              day={day}
              time={slot.time}
              onDrop={handleDropTask}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
  ```

### 4. Drag & Drop (dnd-kit) (3h)

- [ ] Setup DndContext :
  ```tsx
  <DndContext onDragEnd={handleDragEnd}>
    <SortableContext items={backlogTasks.map((t) => t.id)}>
      <BacklogTasksList tasks={backlogTasks} />
    </SortableContext>

    <WeeklyPlanningPreview droppedTasks={droppedTasks} />
  </DndContext>
  ```

- [ ] Handle drop :
  ```ts
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const [day, time] = over.id.toString().split('-'); // "monday-10:00"

    // Ajouter task au planning
    setDroppedTasks((prev) => [
      ...prev,
      {
        taskId,
        day,
        startTime: time,
        // endTime calculé automatiquement
      },
    ]);

    // Retirer de backlog
    setBacklogTasks((prev) => prev.filter((t) => t.id !== taskId));
  }
  ```

- [ ] Afficher tasks droppées dans preview
- [ ] Possibilité de retirer (drag back to backlog)

---

## Jour 4 : Algorithme Génération Planning (8h)

### 5. Use Case : Generate Planning (4h)

- [ ] Créer `packages/core/src/usecases/GenerateWeeklyPlanning.ts`
- [ ] Input : `{ userId, weekStartDate }`
- [ ] Output : `{ timeBlocks: TimeBlock[], totalHours, bufferHours, rescueSlots }`

- [ ] Algorithm :
  ```ts
  async execute(input: GenerateWeeklyPlanningInput): Promise<GenerateWeeklyPlanningOutput> {
    // 1. Get user preferences
    const user = await this.userRepo.findById(input.userId);
    const { chronotype, workHours, bufferPercentage } = user.preferences;

    // 2. Get tasks to plan (Sacred + Important only)
    const tasks = await this.taskRepo.findMany({
      where: {
        userId: input.userId,
        status: 'todo',
        priority: { in: ['sacred', 'important'] },
      },
      orderBy: [
        { priority: 'desc' },
        { difficulty: 'desc' },
        { deadline: 'asc' },
      ],
    });

    // 3. Generate time blocks for each day
    const timeBlocks: TimeBlock[] = [];
    const daysOfWeek = this.getWeekDays(input.weekStartDate);

    for (const day of daysOfWeek) {
      const dayWorkHours = workHours[day.weekday];
      if (!dayWorkHours) continue; // Day off

      const peakHours = this.getPeakHours(chronotype, day.weekday);

      const dayBlocks = this.planDay({
        day: day.date,
        workHours: dayWorkHours,
        peakHours,
        tasks,
        bufferPercentage,
      });

      timeBlocks.push(...dayBlocks);
    }

    // 4. Add rescue slots (vendredi 16h-18h)
    const rescueSlots = this.addRescueSlots(timeBlocks, daysOfWeek, 2);
    timeBlocks.push(...rescueSlots);

    // 5. Validate dependencies
    const validatedBlocks = this.validateDependencies(timeBlocks, tasks);

    // 6. Calculate metrics
    const totalHours = this.calculateTotalHours(validatedBlocks);
    const bufferHours = this.calculateBufferHours(validatedBlocks);

    return {
      timeBlocks: validatedBlocks,
      totalHours,
      bufferHours,
      rescueSlots: rescueSlots.length,
    };
  }
  ```

### 6. Peak Hours Logic (1h)

- [ ] Créer `getPeakHours(chronotype, weekday)` :
  ```ts
  private getPeakHours(chronotype: string, weekday: string) {
    const peakHoursMap = {
      bear: [
        { start: '10:00', end: '12:00' },
        { start: '16:00', end: '18:00' },
      ],
      lion: [
        { start: '08:00', end: '10:00' },
        { start: '14:00', end: '16:00' },
      ],
      wolf: [
        { start: '16:00', end: '18:00' },
        { start: '20:00', end: '22:00' },
      ],
      dolphin: [
        { start: '10:00', end: '12:00' }, // Variable
      ],
    };

    return peakHoursMap[chronotype] || peakHoursMap.bear;
  }
  ```

### 7. Plan Day Logic (3h)

- [ ] Créer `planDay(options)` :
  ```ts
  private planDay(options: {
    day: Date;
    workHours: { start: string; end: string };
    peakHours: { start: string; end: string }[];
    tasks: Task[];
    bufferPercentage: number;
  }): TimeBlock[] {
    const blocks: TimeBlock[] = [];

    // Calculate available minutes
    const totalMinutes = this.calculateMinutes(options.workHours.start, options.workHours.end);
    const bufferMinutes = Math.floor(totalMinutes * (options.bufferPercentage / 100));
    const taskMinutes = totalMinutes - bufferMinutes;

    let currentTime = options.workHours.start;
    let remainingTaskMinutes = taskMinutes;

    // 1. Place difficult tasks (4-5⭐) on peak hours
    for (const peakHour of options.peakHours) {
      const difficultTasks = options.tasks.filter(
        (t) => t.difficulty >= 4 && !t.planned
      );

      for (const task of difficultTasks) {
        if (remainingTaskMinutes <= 0) break;

        // Check if we're in peak hour range
        if (!this.isTimeBetween(currentTime, peakHour.start, peakHour.end)) continue;

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

    // 2. Place medium tasks (3⭐) on normal hours
    const mediumTasks = options.tasks.filter((t) => t.difficulty === 3 && !t.planned);

    for (const task of mediumTasks) {
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

    // 3. Place easy tasks (1-2⭐) on remaining hours
    const easyTasks = options.tasks.filter((t) => t.difficulty <= 2 && !t.planned);

    for (const task of easyTasks) {
      if (remainingTaskMinutes <= 0) break;

      const duration = Math.min(task.estimatedDuration, remainingTaskMinutes);

      blocks.push({
        date: options.day,
        startTime: currentTime,
        endTime: this.addMinutes(currentTime, duration),
        type: 'admin',
        priority: task.priority,
        taskId: task.id,
        taskTitle: task.title,
      });

      currentTime = this.addMinutes(currentTime, duration);
      remainingTaskMinutes -= duration;
      task.planned = true;
    }

    // 4. Add buffer time (free slots)
    if (bufferMinutes > 0) {
      blocks.push({
        date: options.day,
        startTime: currentTime,
        endTime: this.addMinutes(currentTime, bufferMinutes),
        type: 'buffer',
        isFree: true,
      });
    }

    return blocks;
  }
  ```

### 8. Validation Charge (1h)

- [ ] Créer `components/weekly/ChargeValidation.tsx`
- [ ] Calculer temps total planifié
- [ ] Afficher : "18h/20h (90%)" → Vert
- [ ] Si > 20h : "22h/20h (110%)" → Rouge + warning
- [ ] Warning message : "⚠️ Charge trop élevée. Retire 2h de tâches."

### 9. Tests (2h)

- [ ] Test algorithm génère planning
- [ ] Test tâches difficiles → peak hours
- [ ] Test buffer time = 20%
- [ ] Test rescue slots ajoutés (2)
- [ ] Test validation charge > 20h → warning
- [ ] Test drag & drop → task ajoutée au planning

---

## Critères de Succès

- [ ] Drag & drop tasks → planning preview
- [ ] Bouton "Générer Planning" → algorithm s'exécute
- [ ] Tâches difficiles placées sur peak hours
- [ ] Buffer time 20% ajouté
- [ ] Rescue slots ajoutés
- [ ] Validation charge fonctionnelle
- [ ] Preview affiche planning généré

---

## Design Notes

**Planning Preview :**
- 7 colonnes (jours)
- Compact : 1 col = 80px width
- Time slots : height 40px
- Drop zone : border-2 border-dashed border-gray-300
- Drop zone active (hover) : border-blue-500 bg-blue-50

**Drag Ghost :**
- Opacity 0.5 pendant drag
- Cursor : grabbing

**Charge Validation :**
- Progress bar brutale : border-2, pas de rounded
- Couleur : green si < 100%, red si > 100%
- Texte gras : "18h/20h"

---

## Prochaine tâche

Jour 5 : Confirmation et Sauvegarde Planning
