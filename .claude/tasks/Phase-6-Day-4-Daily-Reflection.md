# Phase 6 - Jour 4 : Daily Reflection

**Durée :** 1 jour
**Statut :** 🟡 À faire
**Dépendances :** Jour 1-3 (Dashboard, Timer)

---

## Objectif

Implémenter la réflexion quotidienne de fin de journée avec AI insights.

---

## Tasks

### 1. Daily Reflection Modal (2h)

- [ ] Créer `components/dashboard/DailyReflectionModal.tsx`
- [ ] Trigger :
  - Notification 18h30 (Phase 9)
  - Bouton manuel dans Dashboard
  - Auto-popup si journée terminée (toutes tasks done)

- [ ] Design :
  ```tsx
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          Daily Reflection - {format(new Date(), 'EEEE d MMMM')}
        </DialogTitle>
      </DialogHeader>

      <ReflectionForm onSubmit={handleSave} />

      <DialogFooter>
        <Button variant="ghost" onClick={handleSkip}>
          Skip
        </Button>
        <Button onClick={handleSave}>
          Sauvegarder
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```

### 2. Auto Stats Calculation (2h)

- [ ] Server Action : `calculateDailyStats(userId, date)`
- [ ] Logic :
  ```ts
  export async function calculateDailyStats(userId: string, date: Date) {
    // 1. Get time blocks for today
    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay(date),
          lt: endOfDay(date),
        },
      },
      include: { task: true },
    });

    // 2. Tasks completed vs total
    const tasks = timeBlocks.filter((tb) => tb.task).map((tb) => tb.task);
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;

    // 3. Total hours worked
    const totalMinutes = timeBlocks
      .filter((tb) => !tb.isFree && !tb.isRescue)
      .reduce((sum, tb) => {
        return sum + calculateDuration(tb.startTime, tb.endTime);
      }, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalHours,
    };
  }
  ```

### 3. Reflection Form (3h)

- [ ] Créer `components/dashboard/ReflectionForm.tsx`
- [ ] Fields :
  - Focus Quality (1-5) : Slider
  - Energy Level (1-5) : Slider
  - Wins (optionnel) : Textarea
  - Struggles (optionnel) : Textarea

- [ ] Design :
  ```tsx
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    {/* Auto Stats */}
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Tâches complétées</p>
            <p className="text-2xl font-bold">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Temps total</p>
            <p className="text-2xl font-bold">{stats.totalHours}h</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Focus Quality */}
    <div>
      <Label>Focus Quality (1-5)</Label>
      <div className="flex items-center gap-4 mt-2">
        <Slider
          min={1}
          max={5}
          step={1}
          value={[focusQuality]}
          onValueChange={([value]) => setFocusQuality(value)}
          className="flex-1"
        />
        <span className="text-2xl font-bold w-8">{focusQuality}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        1 = Très distrait, 5 = Hyper focus
      </p>
    </div>

    {/* Energy Level */}
    <div>
      <Label>Energy Level (1-5)</Label>
      <div className="flex items-center gap-4 mt-2">
        <Slider
          min={1}
          max={5}
          step={1}
          value={[energyLevel]}
          onValueChange={([value]) => setEnergyLevel(value)}
          className="flex-1"
        />
        <span className="text-2xl font-bold w-8">{energyLevel}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        1 = Épuisé, 5 = Plein d'énergie
      </p>
    </div>

    {/* Wins */}
    <div>
      <Label htmlFor="wins">Wins (optionnel)</Label>
      <Textarea
        id="wins"
        placeholder="Quels sont tes wins du jour ? (un par ligne)"
        value={wins}
        onChange={(e) => setWins(e.target.value)}
        rows={3}
      />
    </div>

    {/* Struggles */}
    <div>
      <Label htmlFor="struggles">Struggles (optionnel)</Label>
      <Textarea
        id="struggles"
        placeholder="Quelles ont été tes difficultés ? (un par ligne)"
        value={struggles}
        onChange={(e) => setStruggles(e.target.value)}
        rows={3}
      />
    </div>
  </form>
  ```

### 4. AI Insights Generation (2h)

- [ ] Server Action : `generateDailyInsights(data)`
- [ ] Prompt GPT-4o-mini :
  ```ts
  const DAILY_INSIGHTS_PROMPT = `Tu es DevFlow AI. Analyse la journée de l'user et donne 1-2 insights actionnables.

  Stats :
  - Tâches : ${data.completedTasks}/${data.totalTasks} (${data.completionRate}%)
  - Temps total : ${data.totalHours}h
  - Focus quality : ${data.focusQuality}/5
  - Energy level : ${data.energyLevel}/5
  - Wins : ${data.wins || 'Aucun'}
  - Struggles : ${data.struggles || 'Aucune'}

  Ton style : concis, actionnable, positif, dev-oriented, pas de bullshit.

  Exemples :

  "Belle journée ! 5/5 tâches terminées, focus au top (5/5). Continue comme ça."

  "3/5 tâches terminées. Normal, tu as sous-estimé la complexité. Multiplie tes estimations par 1.3."

  "Focus quality bas (2/5). Identifie les distractions (Slack ? Meetings ?) et bloque-les demain."

  "Energy level bas (2/5). Dors plus ce soir ou réduis la charge demain."

  "Win : SEPA Backend terminé. Struggle : Trop de meetings. Bloque des créneaux No-Meeting demain."

  Génère 1-2 insights (max 2 lignes chacun).`;

  export async function generateDailyInsights(data: {
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    totalHours: string;
    focusQuality: number;
    energyLevel: number;
    wins: string;
    struggles: string;
  }) {
    const prompt = DAILY_INSIGHTS_PROMPT
      .replace('${data.completedTasks}', data.completedTasks.toString())
      .replace('${data.totalTasks}', data.totalTasks.toString())
      .replace('${data.completionRate}', data.completionRate.toFixed(0))
      .replace('${data.totalHours}', data.totalHours)
      .replace('${data.focusQuality}', data.focusQuality.toString())
      .replace('${data.energyLevel}', data.energyLevel.toString())
      .replace('${data.wins}', data.wins || 'Aucun')
      .replace('${data.struggles}', data.struggles || 'Aucune');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0].message.content;
  }
  ```

### 5. Save Reflection (2h)

- [ ] Server Action : `saveDailyReflection(data)`
- [ ] Logic :
  ```ts
  export async function saveDailyReflection(data: {
    date: Date;
    focusQuality: number;
    energyLevel: number;
    wins: string;
    struggles: string;
  }) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // 1. Calculate auto stats
    const stats = await calculateDailyStats(session.user.id, data.date);

    // 2. Generate AI insights
    const insights = await generateDailyInsights({
      ...stats,
      focusQuality: data.focusQuality,
      energyLevel: data.energyLevel,
      wins: data.wins,
      struggles: data.struggles,
    });

    // 3. Save reflection
    const reflection = await prisma.dailyReflection.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: startOfDay(data.date),
        },
      },
      update: {
        completedTasks: stats.completedTasks,
        totalTasks: stats.totalTasks,
        focusQuality: data.focusQuality,
        energyLevel: data.energyLevel,
        wins: data.wins.split('\n').filter(Boolean),
        struggles: data.struggles.split('\n').filter(Boolean),
        insights,
      },
      create: {
        userId: session.user.id,
        date: startOfDay(data.date),
        completedTasks: stats.completedTasks,
        totalTasks: stats.totalTasks,
        focusQuality: data.focusQuality,
        energyLevel: data.energyLevel,
        wins: data.wins.split('\n').filter(Boolean),
        struggles: data.struggles.split('\n').filter(Boolean),
        insights,
      },
    });

    return { success: true, reflection };
  }
  ```

### 6. Success State (1h)

- [ ] Après sauvegarde :
  - Afficher AI insights dans modal
  - Toast : "✅ Reflection sauvegardée"
  - Bouton "Fermer"

- [ ] Design :
  ```tsx
  {isSaved && (
    <Card className="bg-blue-50 border-l-4 border-blue-500">
      <CardHeader>
        <h3 className="font-bold">DevFlow AI Insights</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{insights}</p>
      </CardContent>
    </Card>
  )}
  ```

### 7. Skip Flow (30min)

- [ ] Bouton "Skip"
- [ ] Tracking : combien de fois skippée
- [ ] Si skip > 3 jours consécutifs → AI warning dans War Room

### 8. Tests (2h)

- [ ] Test modal ouvre/ferme
- [ ] Test stats auto-calculées
- [ ] Test sliders focusQuality/energyLevel
- [ ] Test AI insights générés
- [ ] Test save → DB
- [ ] Test skip → pas de sauvegarde
- [ ] Test upsert (update si existe déjà)

---

## Critères de Succès

- [ ] Daily Reflection modal fonctionnelle
- [ ] Stats auto-calculées
- [ ] Focus Quality + Energy Level trackés
- [ ] Wins + Struggles optionnels
- [ ] AI génère insights pertinents
- [ ] Reflection sauvegardée en DB
- [ ] Skip tracking
- [ ] Responsive

---

## Design Notes

**Modal :**
- Max-w-2xl
- Border-2 border-black
- Padding généreux (p-6)

**Sliders :**
- Brutaux : track border-2 border-black
- Thumb gros (size-6), border-2
- Valeur affichée à droite (text-2xl font-bold)

**Textareas :**
- Border-2 border-black
- Focus : border-blue-500
- Placeholder gris clair
- Rows : 3 (compact)

**AI Insights Card :**
- Border-l-4 border-blue-500
- Background bg-blue-50
- Icon MessageCircle

**Success Toast :**
- Duration 3s
- Icon CheckCircle
- Green

---

## Prochaine phase

Phase 7 : DevFlow CLI (task import via voice + Claude Code)
