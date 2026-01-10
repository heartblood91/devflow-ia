# Phase 6 : Execution + Daily Reflection

**Durée :** Semaine 7 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Créer Dashboard Quotidien
- [ ] Implémenter Timer (Pomodoro + Ultradian)
- [ ] Mode Focus (fullscreen, distraction-free)
- [ ] Daily Reflection (fin de journée)
- [ ] Tracking progression journalière

---

## Tasks

### 6.1 Dashboard Quotidien

**Durée estimée :** 6h

#### Structure

- [ ] Créer `app/dashboard/page.tsx` :
  - Header : Date du jour, user avatar, settings
  - Section "Tes priorités du jour" (3 tâches max)
  - Timeline de la journée (time blocks)
  - Progression (barre %)
  - Chatbot DevFlow AI (bottom-right)

#### Section Priorités

- [ ] Créer `components/dashboard/DailyPriorities.tsx` :

```tsx
<Card>
  <CardHeader>
    <h2>Tes priorités du jour</h2>
    <p className="text-muted-foreground">
      {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
    </p>
  </CardHeader>

  <CardContent>
    {priorities.map((task, index) => (
      <PriorityCard
        key={task.id}
        task={task}
        rank={index + 1}
        isFrog={index === 0 && task.difficulty >= 4}
        onStart={() => handleStartTask(task.id)}
      />
    ))}

    {priorities.length === 0 && (
      <div className="empty-state">
        Aucune tâche pour aujourd'hui. Profite de ta journée !
      </div>
    )}
  </CardContent>
</Card>
```

- [ ] Créer `components/dashboard/PriorityCard.tsx` :
  - Badge priorité (🔴 🟠 🟢)
  - Badge difficulté (1-5⭐)
  - Si isFrog : icône grenouille 🐸 + label "Eat the Frog"
  - Titre tâche
  - Durée estimée
  - Créneau suggéré (10h-12h)
  - Bouton "Commencer"

**Server Action : Get Daily Priorities**

```ts
"use server";

export async function getDailyPriorities(date: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

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
    include: {
      task: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Extract tasks, max 3 priorities
  const tasks = timeBlocks
    .filter((tb) => tb.task)
    .map((tb) => tb.task)
    .slice(0, 3);

  return tasks;
}
```

#### Section Timeline

- [ ] Créer `components/dashboard/DailyTimeline.tsx` :
  - Timeline verticale (8h → 19h)
  - Affiche tous les time blocks du jour
  - Highlight créneau actuel (barre verte)
  - Click sur block → ouvre détails tâche

```tsx
<div className="timeline">
  {hours.map((hour) => (
    <div key={hour} className="hour-row">
      <div className="hour-label">{hour}</div>

      <div className="blocks">
        {timeBlocks
          .filter((tb) => tb.startTime.startsWith(hour))
          .map((tb) => (
            <TimeBlock
              key={tb.id}
              block={tb}
              isCurrent={isCurrentBlock(tb)}
              onClick={() => handleBlockClick(tb)}
            />
          ))}
      </div>
    </div>
  ))}

  {/* Current time indicator */}
  <div
    className="current-time-indicator"
    style={{ top: `${getCurrentTimeOffset()}px` }}
  >
    <div className="line" />
    <div className="time">{format(new Date(), "HH:mm")}</div>
  </div>
</div>
```

#### Section Progression

- [ ] Créer `components/dashboard/DailyProgress.tsx` :
  - Barre de progression : "3/5 tâches terminées (60%)"
  - Stats : Temps total (4h/6h)
  - Prochaine tâche : "Bug fix dons (16h-18h)"

```tsx
<Card>
  <CardHeader>
    <h3>Progression du jour</h3>
  </CardHeader>

  <CardContent>
    <Progress value={progressPercentage} />

    <div className="stats">
      <div className="stat">
        <CheckCircle className="text-green-500" />
        <span>
          {completedTasks} / {totalTasks} tâches
        </span>
      </div>

      <div className="stat">
        <Clock />
        <span>
          {completedHours}h / {totalHours}h
        </span>
      </div>
    </div>

    {nextTask && (
      <div className="next-task">
        <h4>Prochaine tâche :</h4>
        <p>{nextTask.title}</p>
        <p className="text-muted-foreground">
          {nextTask.startTime} - {nextTask.endTime}
        </p>
        <Button onClick={() => handleStartTask(nextTask.id)}>
          Commencer maintenant
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

**Tests :**

- [ ] Test affichage priorités (max 3)
- [ ] Test timeline affiche tous les blocks
- [ ] Test current time indicator position
- [ ] Test progression calculée correctement

---

### 6.2 Timer (Pomodoro + Ultradian)

**Durée estimée :** 8h

#### Modal Choix Timer

- [ ] Créer `components/timer/TimerModeModal.tsx` :
  - User clique "Commencer" sur une tâche
  - Modal s'ouvre avec 2 options :
    - Pomodoro (25 min travail / 5 min pause)
    - Ultradian (90 min travail / 20 min pause)
  - User choisit → démarre timer

#### Timer UI

- [ ] Créer `components/timer/Timer.tsx` :

```tsx
<div className="timer-container">
  <div className="timer-display">
    <h1 className="countdown">{formatTime(timeRemaining)}</h1>
    <p className="task-title">{currentTask.title}</p>
    <p className="mode">
      {mode} - {phase}
    </p>
  </div>

  <div className="controls">
    {status === "idle" && (
      <Button size="lg" onClick={handleStart}>
        <Play /> Start
      </Button>
    )}

    {status === "running" && (
      <>
        <Button size="lg" variant="secondary" onClick={handlePause}>
          <Pause /> Pause
        </Button>
        <Button size="lg" variant="destructive" onClick={handleStop}>
          <Square /> Stop
        </Button>
      </>
    )}

    {status === "paused" && (
      <>
        <Button size="lg" onClick={handleResume}>
          <Play /> Resume
        </Button>
        <Button size="lg" variant="destructive" onClick={handleStop}>
          <Square /> Stop
        </Button>
      </>
    )}
  </div>

  <div className="actions">
    <Button variant="ghost" onClick={handleToggleFocusMode}>
      {isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
    </Button>
  </div>
</div>
```

#### Timer Logic

- [ ] Créer hook `useTimer` :

```ts
type TimerMode = "pomodoro" | "ultradian";
type TimerPhase = "work" | "break";
type TimerStatus = "idle" | "running" | "paused" | "completed";

function useTimer(mode: TimerMode, taskId: string) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const durations = {
    pomodoro: { work: 25 * 60, break: 5 * 60 },
    ultradian: { work: 90 * 60, break: 20 * 60 },
  };

  const start = () => {
    setTimeRemaining(durations[mode][phase]);
    setStatus("running");

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setStatus("paused");
  };

  const resume = () => {
    setStatus("running");
    start();
  };

  const stop = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setStatus("idle");

    // Log time spent
    await logTimeSpent(taskId, calculateTimeSpent());
  };

  const handlePhaseComplete = async () => {
    // Play sound notification
    playNotificationSound();

    if (phase === "work") {
      // Work phase completed → break
      setPhase("break");
      toast.success(`Pause ${mode === "pomodoro" ? "5" : "20"} min`);
      await logWorkSession(taskId, durations[mode].work);
    } else {
      // Break completed → ask to continue or finish
      setPhase("work");
      setStatus("completed");
      toast.info("Pause terminée. Continuer ?");
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    phase,
    status,
    start,
    pause,
    resume,
    stop,
  };
}
```

**Server Actions :**

- [ ] `logWorkSession` :

  ```ts
  "use server";

  export async function logWorkSession(taskId: string, duration: number) {
    // Update task with time spent
    await prisma.task.update({
      where: { id: taskId },
      data: {
        // Store work sessions in JSON field or separate table
      },
    });
  }
  ```

#### Mode Focus

- [ ] Créer `components/timer/FocusMode.tsx` :
  - Fullscreen overlay
  - Affiche uniquement timer + task title
  - Background dégradé calme
  - Exit button (ESC key)
  - Bloque notifications (Web Notifications API)

```tsx
<div className={`focus-mode ${isFocusMode ? "active" : ""}`}>
  <div className="focus-content">
    <h1 className="countdown">{formatTime(timeRemaining)}</h1>
    <p className="task-title">{currentTask.title}</p>

    <Button
      variant="ghost"
      className="exit-button"
      onClick={handleExitFocusMode}
    >
      <X /> Exit Focus Mode (ESC)
    </Button>
  </div>
</div>
```

**Tests :**

- [ ] Test timer countdown (Pomodoro 25 min)
- [ ] Test timer countdown (Ultradian 90 min)
- [ ] Test pause/resume
- [ ] Test stop → log time spent
- [ ] Test phase complete → switch work/break
- [ ] Test focus mode → fullscreen

---

### 6.3 Daily Reflection

**Durée estimée :** 6h

#### Déclenchement

- [ ] Notification 18h30 : "Journée terminée. Daily reflection (5 min) ?"
- [ ] User clique → ouvre modal Daily Reflection
- [ ] Ou : User peut skip (accessible via dashboard)

#### Modal Structure

- [ ] Créer `components/dashboard/DailyReflectionModal.tsx` :

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        Daily Reflection - {format(new Date(), "EEEE d MMMM")}
      </DialogTitle>
    </DialogHeader>

    <div className="reflection-form">
      {/* Stats auto-générées */}
      <div className="stats">
        <p>
          Tâches complétées : {completedTasks} / {totalTasks}
        </p>
        <p>Temps total : {totalHours}h</p>
      </div>

      {/* Questions */}
      <div className="questions">
        <FormField label="Focus Quality (1-5)">
          <Slider
            min={1}
            max={5}
            value={focusQuality}
            onChange={setFocusQuality}
          />
        </FormField>

        <FormField label="Energy Level (1-5)">
          <Slider
            min={1}
            max={5}
            value={energyLevel}
            onChange={setEnergyLevel}
          />
        </FormField>

        <FormField label="Wins (optionnel)">
          <Textarea
            placeholder="Quels sont tes wins du jour ?"
            value={wins}
            onChange={(e) => setWins(e.target.value)}
          />
        </FormField>

        <FormField label="Struggles (optionnel)">
          <Textarea
            placeholder="Quels ont été tes difficultés ?"
            value={struggles}
            onChange={(e) => setStruggles(e.target.value)}
          />
        </FormField>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="ai-insights">
          <h3>DevFlow AI Insights</h3>
          <p>{aiInsights}</p>
        </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="ghost" onClick={handleSkip}>
        Skip
      </Button>
      <Button onClick={handleSave}>Sauvegarder</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Server Action : Sauvegarder Reflection**

```ts
"use server";

export async function saveDailyReflection(data: {
  date: Date;
  focusQuality: number;
  energyLevel: number;
  wins: string;
  struggles: string;
}) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get auto stats
  const stats = await calculateDailyStats(session.user.id, data.date);

  // Generate AI insights
  const insights = await generateDailyInsights({
    ...stats,
    focusQuality: data.focusQuality,
    energyLevel: data.energyLevel,
    wins: data.wins,
    struggles: data.struggles,
  });

  // Save reflection
  await prisma.dailyReflection.create({
    data: {
      userId: session.user.id,
      date: data.date,
      completedTasks: stats.completedTasks,
      totalTasks: stats.totalTasks,
      focusQuality: data.focusQuality,
      energyLevel: data.energyLevel,
      wins: data.wins.split("\n").filter(Boolean),
      struggles: data.struggles.split("\n").filter(Boolean),
      insights,
    },
  });

  return { success: true };
}

async function generateDailyInsights(data: {
  completedTasks: number;
  totalTasks: number;
  focusQuality: number;
  energyLevel: number;
  wins: string;
  struggles: string;
}) {
  const prompt = `Tu es DevFlow AI. Analyse la journée de l'user et donne 1-2 insights.

Stats :
- Tâches : ${data.completedTasks}/${data.totalTasks}
- Focus : ${data.focusQuality}/5
- Énergie : ${data.energyLevel}/5
- Wins : ${data.wins || "Aucun"}
- Struggles : ${data.struggles || "Aucune"}

Ton style : concis, actionnable, positif.

Exemples :
- "Belle journée ! Focus au top. Continue comme ça."
- "Énergie basse (2/5). Dors plus ce soir."
- "3/5 tâches terminées. Normal, tu as sous-estimé la complexité."

Génère 1-2 insights (max 2 lignes).`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
    max_tokens: 150,
  });

  return completion.choices[0].message.content;
}
```

**Tests :**

- [ ] Test reflection → sauvegardée en DB
- [ ] Test AI insights générés
- [ ] Test skip → pas de sauvegarde
- [ ] Test stats auto-calculées

---

### 6.4 Chatbot DevFlow AI (Dashboard)

**Durée estimée :** 4h

#### Position

- [ ] Bottom-right corner (floating button)
- [ ] Click → ouvre chat panel (slide-in)

#### Features

- [ ] Questions rapides :
  - "Quelle est ma prochaine tâche ?"
  - "Combien de temps reste sur cette tâche ?"
  - "Déplace ma tâche à demain"
  - "Montre-moi mes stats de la semaine"

- [ ] Conversational (GPT-4o-mini)

**Implementation :**

- [ ] Créer `components/dashboard/ChatbotPanel.tsx` :
  - Slide-in panel from right
  - Chat interface (bulles)
  - Input + Send button
  - Quick actions (boutons pré-définis)

- [ ] Créer `app/api/chatbot/route.ts` :

  ```ts
  export async function POST(req: Request) {
    const { message } = await req.json();
    const session = await getServerSession(authOptions);

    // Get user context (current tasks, stats, etc.)
    const context = await getUserContext(session.user.id);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CHATBOT_PROMPT },
        { role: "user", content: JSON.stringify(context) },
        { role: "user", content: message },
      ],
    });

    return Response.json({ reply: completion.choices[0].message.content });
  }
  ```

**Tests :**

- [ ] Test question "Prochaine tâche" → réponse correcte
- [ ] Test action "Déplace à demain" → task moved
- [ ] Test stats request → affichage stats

---

## Critères de Succès

- [ ] Dashboard affiche priorités du jour
- [ ] Timeline affiche time blocks
- [ ] Timer Pomodoro/Ultradian fonctionnel
- [ ] Mode Focus implémenté
- [ ] Daily Reflection sauvegardée
- [ ] AI génère insights quotidiens
- [ ] Chatbot DevFlow AI accessible
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 7 (DevFlow CLI)

---

## Risques

**Risque 1 : Timer pas précis (drift)**

- **Impact :** User perd confiance
- **Mitigation :** Utiliser Date.now() pour calcul précis

**Risque 2 : Focus mode bloqué (bug exit)**

- **Impact :** User bloqué en fullscreen
- **Mitigation :** Toujours avoir ESC key fonctionnel

**Risque 3 : Daily reflection trop longue**

- **Impact :** User skip
- **Mitigation :** Max 2 min (questions simples)

---

## Notes

- Dashboard doit être rapide (< 200ms)
- Timer doit être fiable (testable)
- Reflection optionnelle mais encouragée

---

**Prochaine phase :** Phase 7 - DevFlow CLI
