# Phase 5 - Jour 1 : Weekly View (Calendrier Semaine)

**Durée :** 1 jour
**Statut :** 🟡 À faire
**Dépendances :** Phase 4 complète

---

## Objectif

Créer la vue hebdomadaire (calendrier 7 jours) avec affichage des time blocks.

---

## Tasks

### 1. Page Weekly View (3h)

- [ ] Créer `app/weekly/page.tsx`
- [ ] Layout de base :
  ```tsx
  <div className="weekly-view">
    <WeeklyHeader />
    <WeeklyGrid />
    <WeeklySidebar />
  </div>
  ```

### 2. Weekly Header (1h)

- [ ] Créer `components/weekly/WeeklyHeader.tsx`
- [ ] Afficher : "Semaine du 6 - 12 janvier 2026"
- [ ] Boutons navigation : ← Semaine précédente | Semaine suivante →
- [ ] Bouton "War Room" (top-right)

### 3. Weekly Grid (4h)

- [ ] Créer `components/weekly/WeeklyGrid.tsx`
- [ ] Structure :
  ```
  [Horaires] [Lun] [Mar] [Mer] [Jeu] [Ven] [Sam] [Dim]
  08:00      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  09:00      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  ...
  ```
- [ ] Colonne horaires (8h-19h, step 1h)
- [ ] 7 colonnes jours
- [ ] Grid CSS (8 cols, auto rows)

### 4. Day Column Component (2h)

- [ ] Créer `components/weekly/DayColumn.tsx`
- [ ] Props : `day: Date`, `timeBlocks: TimeBlock[]`, `workHours: { start, end }`
- [ ] Afficher workHours en background (gris clair)
- [ ] Afficher time blocks par-dessus
- [ ] Zone "OFF" si pas workHours (samedi/dimanche)

### 5. Time Block Display (2h)

- [ ] Créer `components/weekly/TimeBlock.tsx`
- [ ] Positionner selon `startTime` (calcul offset top)
- [ ] Height selon durée (1 min = 1px)
- [ ] Couleur selon priorité :
  - Sacred : bg-red-500
  - Important : bg-orange-500
  - Optional : bg-green-500
  - Buffer : bg-gray-100 border-dashed
  - Rescue : bg-yellow-400
- [ ] Afficher titre tâche (ellipsis si trop long)
- [ ] Afficher horaire (10:00 - 12:00)

### 6. Server Action : Get Week Blocks (1h)

- [ ] Créer `getWeeklyTimeBlocks(weekStartDate: Date)`
- [ ] Query Prisma :
  ```ts
  const blocks = await prisma.timeBlock.findMany({
    where: {
      userId: session.user.id,
      date: { gte: weekStart, lt: weekEnd },
    },
    include: { task: true },
    orderBy: { startTime: 'asc' },
  });
  ```
- [ ] Grouper par jour
- [ ] Return : `{ monday: [...], tuesday: [...], ... }`

### 7. Navigation Semaines (1h)

- [ ] State `currentWeek` (useState)
- [ ] Bouton Previous : `setCurrentWeek(subWeeks(currentWeek, 1))`
- [ ] Bouton Next : `setCurrentWeek(addWeeks(currentWeek, 1))`
- [ ] Re-fetch blocks on week change

### 8. Tests (2h)

- [ ] Test affichage semaine courante
- [ ] Test navigation prev/next
- [ ] Test time blocks positionnés correctement
- [ ] Test workHours affichées
- [ ] Test responsive (mobile : scroll horizontal)

---

## Critères de Succès

- [ ] Weekly View affiche 7 jours
- [ ] Navigation semaines fonctionnelle
- [ ] Time blocks affichés avec bonnes couleurs
- [ ] Responsive (scroll horizontal sur mobile)

---

## Design Notes

**Style : Brutal/Minimalist**
- Grid strict, borders épaisses (2px)
- Horaires en gras (font-bold)
- Jours en uppercase (MON, TUE, WED, etc.)
- Time blocks : border-radius minimal (4px max)
- Couleurs priorités : red-500, orange-500, green-500 (pas de gradients)
- Hover : border épaissit (2px → 4px), pas de shadow

**Typographie :**
- Header semaine : text-2xl font-bold
- Jours : text-sm font-semibold uppercase
- Horaires : text-xs font-medium text-gray-500
- Time blocks : text-sm

---

## Prochaine tâche

Jour 2 : War Room Modal (Rétrospective)
