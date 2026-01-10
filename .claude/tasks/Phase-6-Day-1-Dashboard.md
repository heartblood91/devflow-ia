# Phase 6 - Jour 1 : Dashboard Quotidien

**Durée :** 1 jour
**Statut :** 🟡 À faire
**Dépendances :** Phase 5 complète

---

## Objectif

Créer le Dashboard quotidien : priorités du jour, timeline, progression.

---

## Tasks

### 1. Page Dashboard (2h)

- [ ] Créer `app/dashboard/page.tsx`
- [ ] Layout 3 colonnes (desktop) → 1 col (mobile) :

  ```tsx
  <div className="dashboard">
    <DashboardHeader />

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DailyPriorities />
        <DailyTimeline />
      </div>

      <div>
        <DailyProgress />
        <ChatbotTrigger />
      </div>
    </div>
  </div>
  ```

### 2. Dashboard Header (1h)

- [ ] Créer `components/dashboard/DashboardHeader.tsx`
- [ ] Afficher :
  - Date du jour (grand) : "Lundi 6 janvier 2026"
  - User avatar + nom (top-right)
  - Bouton Settings (icon)

- [ ] Design :

  ```tsx
  <header className="dashboard-header">
    <div>
      <h1 className="text-4xl font-bold">
        {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
      </h1>
    </div>

    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/settings">
          <Settings />
        </Link>
      </Button>

      <Avatar>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      </Avatar>
    </div>
  </header>
  ```

### 3. Daily Priorities (3h)

- [ ] Créer `components/dashboard/DailyPriorities.tsx`
- [ ] Server Action : `getDailyPriorities(date: Date)`
- [ ] Logic :

  ```ts
  export async function getDailyPriorities(date: Date) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Get time blocks for today
    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfDay(date),
          lt: endOfDay(date),
        },
        isFree: false,
        isRescue: false,
      },
      include: { task: true },
      orderBy: [
        { task: { priority: "desc" } },
        { task: { difficulty: "desc" } },
        { startTime: "asc" },
      ],
    });

    // Extract top 3 tasks
    const tasks = timeBlocks
      .filter((tb) => tb.task)
      .map((tb) => ({
        ...tb.task,
        startTime: tb.startTime,
        endTime: tb.endTime,
      }))
      .slice(0, 3);

    return tasks;
  }
  ```

- [ ] Affichage :

  ```tsx
  <Card>
    <CardHeader>
      <h2 className="text-2xl font-bold">Tes priorités du jour</h2>
    </CardHeader>

    <CardContent>
      <div className="priorities-list space-y-4">
        {priorities.map((task, index) => (
          <PriorityCard
            key={task.id}
            task={task}
            rank={index + 1}
            isFrog={index === 0 && task.difficulty >= 4}
          />
        ))}

        {priorities.length === 0 && (
          <EmptyState
            icon={Coffee}
            title="Aucune tâche pour aujourd'hui"
            description="Profite de ta journée libre !"
          />
        )}
      </div>
    </CardContent>
  </Card>
  ```

### 4. Priority Card (2h)

- [ ] Créer `components/dashboard/PriorityCard.tsx`
- [ ] Props : `task`, `rank`, `isFrog`
- [ ] Design :

  ```tsx
  <div className="priority-card border-2 border-black p-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="rank text-4xl font-bold text-gray-300">{rank}</div>

        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge priority={task.priority} />
            <Badge difficulty={task.difficulty} />
            {isFrog && <span className="text-2xl">🐸</span>}
          </div>

          <h3 className="text-xl font-bold">{task.title}</h3>

          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="size-4" />
              {task.estimatedDuration} min
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              {task.startTime} - {task.endTime}
            </div>
          </div>
        </div>
      </div>

      <Button onClick={() => handleStartTask(task.id)}>Commencer</Button>
    </div>

    {isFrog && (
      <div className="mt-3 border-l-4 border-green-500 bg-green-50 p-3">
        <p className="text-sm font-semibold">
          🐸 Eat the Frog : Commence par la tâche la plus difficile
        </p>
      </div>
    )}
  </div>
  ```

### 5. Daily Timeline (3h)

- [ ] Créer `components/dashboard/DailyTimeline.tsx`
- [ ] Afficher tous les time blocks du jour
- [ ] Timeline verticale (8h-19h)
- [ ] Current time indicator (barre verte)

- [ ] Design :

  ```tsx
  <Card>
    <CardHeader>
      <h2 className="text-2xl font-bold">Timeline de la journée</h2>
    </CardHeader>

    <CardContent>
      <div className="timeline relative">
        {hours.map((hour) => (
          <div key={hour} className="hour-row flex gap-4">
            <div className="hour-label w-16 text-sm font-medium text-gray-500">
              {hour}
            </div>

            <div className="hour-blocks relative flex-1">
              {timeBlocks
                .filter((tb) => tb.startTime.startsWith(hour))
                .map((tb) => (
                  <TimeBlockCard
                    key={tb.id}
                    block={tb}
                    isCurrent={isCurrentBlock(tb)}
                  />
                ))}
            </div>
          </div>
        ))}

        {/* Current time indicator */}
        <div
          className="current-time-line absolute right-0 left-0 border-t-4 border-green-500"
          style={{ top: `${getCurrentTimeOffset()}px` }}
        >
          <div className="current-time-label bg-green-500 px-2 py-1 text-xs font-bold text-white">
            {format(new Date(), "HH:mm")}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  ```

### 6. Daily Progress (2h)

- [ ] Créer `components/dashboard/DailyProgress.tsx`
- [ ] Calculer :
  - Tasks complétées : 3/5
  - Temps passé : 4h/6h
  - Prochaine tâche

- [ ] Design :

  ```tsx
  <Card>
    <CardHeader>
      <h3 className="text-xl font-bold">Progression</h3>
    </CardHeader>

    <CardContent>
      <div className="progress-bar mb-4">
        <div className="mb-2 flex justify-between">
          <span className="text-sm font-medium">
            {completedTasks}/{totalTasks} tâches
          </span>
          <span className="text-sm font-bold">{percentage}%</span>
        </div>

        <div className="h-4 border-2 border-black bg-gray-200">
          <div
            className="h-full bg-green-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="stats space-y-2">
        <div className="stat-row flex justify-between">
          <span className="text-sm">Temps passé</span>
          <span className="font-bold">
            {completedHours}h/{totalHours}h
          </span>
        </div>
      </div>

      {nextTask && (
        <div className="next-task mt-4 border-2 border-black p-3">
          <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">
            Prochaine tâche
          </p>
          <p className="font-bold">{nextTask.title}</p>
          <p className="text-sm text-gray-600">
            {nextTask.startTime} - {nextTask.endTime}
          </p>
          <Button
            className="mt-2 w-full"
            onClick={() => handleStartTask(nextTask.id)}
          >
            Commencer maintenant
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
  ```

### 7. Empty State (1h)

- [ ] Si aucune tâche aujourd'hui
- [ ] CTA : "Planifier ma semaine" → redirect /weekly

### 8. Tests (2h)

- [ ] Test affichage priorités (top 3)
- [ ] Test Frog badge si difficulty >= 4
- [ ] Test timeline affiche tous blocks
- [ ] Test current time indicator position
- [ ] Test progression calculée correctement
- [ ] Test empty state si aucune tâche

---

## Critères de Succès

- [ ] Dashboard affiche date + user
- [ ] Top 3 priorités affichées
- [ ] Frog indicator si tâche difficile
- [ ] Timeline affiche tous blocks
- [ ] Current time indicator
- [ ] Progression calculée
- [ ] Prochaine tâche affichée
- [ ] Responsive

---

## Design Notes

**Palette :**

- Background : bg-gray-50
- Cards : bg-white border-2 border-black
- Text : text-gray-900 (primary), text-gray-600 (secondary)
- Accents : green-500 (success), blue-500 (info), red-500 (sacred)

**Typography :**

- Date : text-4xl font-bold
- Card titles : text-2xl font-bold
- Task titles : text-xl font-bold
- Body : text-base
- Small : text-sm

**Spacing :**

- Gap entre cards : gap-6
- Padding cards : p-6
- Spacing interne : space-y-4

**Buttons :**

- Border-2 border-black
- Hover : bg-black text-white (invert)
- Transition : all 200ms

---

## Prochaine tâche

Jour 2 : Timer (Pomodoro + Ultradian)
