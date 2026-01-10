# Phase 6 - Jour 2-3 : Timer + Focus Mode

**Durée :** 2 jours
**Statut :** 🟡 À faire
**Dépendances :** Jour 1 (Dashboard)

---

## Objectif

Implémenter le timer (Pomodoro + Ultradian) avec Mode Focus.

---

## Jour 2 : Timer Logic (8h)

### 1. useTimer Hook (3h)

- [ ] Créer `hooks/useTimer.ts`
- [ ] Logic :

  ```ts
  type TimerMode = "pomodoro" | "ultradian";
  type TimerPhase = "work" | "break";
  type TimerStatus = "idle" | "running" | "paused" | "completed";

  export function useTimer(mode: TimerMode, taskId: string) {
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

      const startTime = Date.now();
      const targetDuration = durations[mode][phase] * 1000;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, targetDuration - elapsed);

        setTimeRemaining(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          handlePhaseComplete();
        }
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
      const timeSpent = durations[mode].work - timeRemaining;
      await logWorkSession(taskId, timeSpent);
    };

    const handlePhaseComplete = async () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Play sound
      playNotificationSound();

      if (phase === "work") {
        // Work completed → break
        setPhase("break");
        setStatus("completed");

        toast.success(`Pause ${mode === "pomodoro" ? "5" : "20"} min`, {
          action: {
            label: "Commencer pause",
            onClick: () => {
              setStatus("running");
              start();
            },
          },
        });

        await logWorkSession(taskId, durations[mode].work);
      } else {
        // Break completed
        setPhase("work");
        setStatus("completed");

        toast.info("Pause terminée. Continuer ?", {
          action: {
            label: "Continuer",
            onClick: () => {
              setStatus("running");
              start();
            },
          },
        });
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

### 2. Timer Modal (2h)

- [ ] Créer `components/timer/TimerModeModal.tsx`
- [ ] User clique "Commencer" sur task → modal s'ouvre
- [ ] 2 options : Pomodoro ou Ultradian

- [ ] Design :

  ```tsx
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Choisis ton mode de travail</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <button
          className="mode-card border-2 border-black p-6 hover:bg-black hover:text-white"
          onClick={() => handleSelectMode("pomodoro")}
        >
          <Timer className="mb-2 size-12" />
          <h3 className="text-xl font-bold">Pomodoro</h3>
          <p className="mt-2 text-sm">25 min travail</p>
          <p className="text-sm">5 min pause</p>
        </button>

        <button
          className="mode-card border-2 border-black p-6 hover:bg-black hover:text-white"
          onClick={() => handleSelectMode("ultradian")}
        >
          <Zap className="mb-2 size-12" />
          <h3 className="text-xl font-bold">Ultradian</h3>
          <p className="mt-2 text-sm">90 min travail</p>
          <p className="text-sm">20 min pause</p>
        </button>
      </div>
    </DialogContent>
  </Dialog>
  ```

### 3. Timer UI (3h)

- [ ] Créer `components/timer/Timer.tsx`
- [ ] Afficher countdown grand format
- [ ] Boutons Start/Pause/Stop
- [ ] Bouton "Focus Mode"

- [ ] Design :

  ```tsx
  <div className="timer-container flex min-h-screen items-center justify-center">
    <Card className="w-full max-w-md border-4 border-black">
      <CardContent className="p-8 text-center">
        <p className="mb-2 text-sm font-semibold text-gray-500 uppercase">
          {task.title}
        </p>

        <div className="countdown mb-4 text-8xl font-bold">
          {formatTime(timeRemaining)}
        </div>

        <p className="mb-6 text-lg font-semibold">
          {mode === "pomodoro" ? "Pomodoro" : "Ultradian"} -{" "}
          {phase === "work" ? "Travail" : "Pause"}
        </p>

        <div className="controls mb-4 flex justify-center gap-4">
          {status === "idle" && (
            <Button size="lg" onClick={start}>
              <Play /> Start
            </Button>
          )}

          {status === "running" && (
            <>
              <Button size="lg" variant="secondary" onClick={pause}>
                <Pause /> Pause
              </Button>
              <Button size="lg" variant="destructive" onClick={stop}>
                <Square /> Stop
              </Button>
            </>
          )}

          {status === "paused" && (
            <>
              <Button size="lg" onClick={resume}>
                <Play /> Resume
              </Button>
              <Button size="lg" variant="destructive" onClick={stop}>
                <Square /> Stop
              </Button>
            </>
          )}
        </div>

        <Button variant="outline" onClick={() => setIsFocusMode(true)}>
          Enter Focus Mode
        </Button>
      </CardContent>
    </Card>
  </div>
  ```

### 4. Format Time Helper (30min)

- [ ] Créer `utils/formatTime.ts`
- [ ] Logic :
  ```ts
  export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  ```

### 5. Notification Sound (1h)

- [ ] Créer `public/notification.mp3` (son simple, court)
- [ ] Function :
  ```ts
  export function playNotificationSound() {
    const audio = new Audio("/notification.mp3");
    audio.play().catch((err) => {
      console.warn("Audio play failed:", err);
    });
  }
  ```

### 6. Server Action : Log Work Session (1h)

- [ ] Créer `logWorkSession(taskId, durationSeconds)`
- [ ] Sauvegarder dans DB (table WorkSession ou JSON field)
- [ ] Update task avec temps passé

---

## Jour 3 : Focus Mode (8h)

### 7. Focus Mode Component (3h)

- [ ] Créer `components/timer/FocusMode.tsx`
- [ ] Fullscreen overlay
- [ ] Affiche uniquement timer + task title
- [ ] Background calme (gradient subtil ou solid color)

- [ ] Design :

  ```tsx
  <div
    className={`focus-mode fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-black ${
      isFocusMode ? "block" : "hidden"
    }`}
  >
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-white">
      <p className="mb-4 text-sm tracking-wide text-gray-400 uppercase">
        Focus Mode
      </p>

      <h1 className="mb-8 text-center text-4xl font-bold">{task.title}</h1>

      <div className="countdown mb-12 text-9xl font-bold">
        {formatTime(timeRemaining)}
      </div>

      <p className="mb-8 text-xl text-gray-400">
        {phase === "work" ? "Reste concentré" : "Profite de ta pause"}
      </p>

      <div className="controls flex gap-4">
        {status === "running" && (
          <Button size="lg" variant="ghost" onClick={pause}>
            <Pause /> Pause
          </Button>
        )}

        {status === "paused" && (
          <Button size="lg" variant="ghost" onClick={resume}>
            <Play /> Resume
          </Button>
        )}

        <Button size="lg" variant="ghost" onClick={stop}>
          <Square /> Stop
        </Button>
      </div>

      <Button
        variant="ghost"
        className="absolute top-8 right-8"
        onClick={() => setIsFocusMode(false)}
      >
        <X className="size-6" /> Exit (ESC)
      </Button>
    </div>
  </div>
  ```

### 8. Keyboard Shortcuts (2h)

- [ ] ESC : Exit Focus Mode
- [ ] Space : Pause/Resume
- [ ] S : Stop

- [ ] Implementation :

  ```tsx
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isFocusMode) return;

      if (e.key === "Escape") {
        setIsFocusMode(false);
      }

      if (e.key === " ") {
        e.preventDefault();
        if (status === "running") {
          pause();
        } else if (status === "paused") {
          resume();
        }
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        stop();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, status]);
  ```

### 9. Block Notifications (1h)

- [ ] Quand Focus Mode activé :
  - Document title change : "🔴 Focus Mode"
  - Request fullscreen (optionnel, user consent)
  - Pas de notifications push pendant focus

- [ ] Logic :

  ```ts
  useEffect(() => {
    if (isFocusMode) {
      document.title = "🔴 Focus Mode - DevFlow";

      // Request fullscreen (optionnel)
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // User denied
        });
      }
    } else {
      document.title = "DevFlow";

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [isFocusMode]);
  ```

### 10. Progress Ring (optionnel, 2h)

- [ ] Cercle de progression autour du countdown
- [ ] Utiliser SVG circle avec stroke-dasharray

- [ ] Code :

  ```tsx
  const progress = (timeRemaining / totalDuration) * 100;
  const circumference = 2 * Math.PI * 120; // radius 120
  const offset = circumference - (progress / 100) * circumference;

  <svg className="absolute inset-0" width="300" height="300">
    <circle
      cx="150"
      cy="150"
      r="120"
      stroke="currentColor"
      strokeWidth="8"
      fill="none"
      className="text-gray-700"
    />
    <circle
      cx="150"
      cy="150"
      r="120"
      stroke="currentColor"
      strokeWidth="8"
      fill="none"
      className="text-green-500"
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      transform="rotate(-90 150 150)"
    />
  </svg>;
  ```

### 11. Tests (2h)

- [ ] Test timer countdown précis (no drift)
- [ ] Test pause/resume fonctionne
- [ ] Test stop → log session
- [ ] Test phase complete → switch work/break
- [ ] Test Focus Mode → fullscreen
- [ ] Test ESC exit Focus Mode
- [ ] Test keyboard shortcuts

---

## Critères de Succès

- [ ] Timer Pomodoro/Ultradian fonctionne
- [ ] Countdown précis (pas de drift)
- [ ] Pause/Resume/Stop fonctionnels
- [ ] Phase work/break switch automatique
- [ ] Focus Mode fullscreen
- [ ] Keyboard shortcuts actifs
- [ ] Notifications bloquées en Focus Mode
- [ ] Work sessions loggées

---

## Design Notes

**Timer Normal :**

- Card border-4 border-black
- Countdown : text-8xl font-bold
- Boutons gros (lg), espacés (gap-4)

**Focus Mode :**

- Background : gradient dark (gray-900 → black)
- Text : white
- Countdown : text-9xl
- Minimal distractions
- Exit button visible mais discret (top-right)

**Keyboard Shortcuts Hint :**

- Afficher en bas de Focus Mode (text-xs, opacity-50)
- "ESC: Exit | SPACE: Pause/Resume | S: Stop"

---

## Prochaine tâche

Jour 4 : Daily Reflection
