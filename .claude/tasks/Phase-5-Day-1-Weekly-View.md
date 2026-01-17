# Phase 5 - Jour 1 : Weekly View (Calendrier Semaine)

**Durée :** 1 jour
**Statut :** ✅ Terminé
**Dépendances :** Phase 4 complète
**PR :** https://github.com/heartblood91/devflow-ia/pull/4

---

## Objectif

Créer la vue hebdomadaire (calendrier 7 jours) avec affichage des time blocks.

---

## Tasks

### 1. Page Weekly View (3h) ✅

- [x] Créer `app/app/weekly/page.tsx`
- [x] Layout de base :
  ```tsx
  <div className="weekly-view">
    <WeeklyHeader />
    <WeeklyGrid />
    <WeeklySidebar /> // Coming Soon
  </div>
  ```

### 2. Weekly Header (1h) ✅

- [x] Créer `components/weekly/WeeklyHeader.tsx`
- [x] Afficher : "Week of January 12 - 18, 2026" (i18n)
- [x] Boutons navigation : ← Semaine précédente | Semaine suivante →
- [x] Bouton "War Room" (top-right)

### 3. Weekly Grid (4h) ✅

- [x] Créer `components/weekly/WeeklyGrid.tsx`
- [x] Structure :
  ```
  [Horaires] [Lun] [Mar] [Mer] [Jeu] [Ven] [Sam] [Dim]
  08:00      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  09:00      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  ...
  ```
- [x] Colonne horaires (8h-19h, step 1h)
- [x] 7 colonnes jours
- [x] Grid CSS (8 cols, auto rows)

### 4. Day Column Component (2h) ✅

- [x] Créer `components/weekly/DayColumn.tsx`
- [x] Props : `day: Date`, `timeBlocks: TimeBlock[]`, `workHours: { start, end }`
- [x] Afficher workHours en background (primary/10-20)
- [x] Afficher time blocks par-dessus
- [x] Zone "OFF" si pas workHours (samedi/dimanche)

### 5. Time Block Display (2h) ✅

- [x] Créer `components/weekly/TimeBlockCard.tsx`
- [x] Positionner selon `startTime` (calcul offset top)
- [x] Height selon durée
- [x] Couleur selon priorité (+ pastel dark mode) :
  - Sacred : bg-red-500 / dark:bg-red-400/70
  - Important : bg-orange-500 / dark:bg-orange-400/70
  - Optional : bg-green-500 / dark:bg-green-400/70
  - Buffer : bg-gray-200 border-dashed / dark:bg-gray-600/50
  - Rescue : bg-yellow-400 / dark:bg-yellow-400/60
- [x] Afficher titre tâche (line-clamp-2 multi-lignes)
- [x] Afficher horaire (10:00 - 12:00)

### 6. Server Action : Get Week Blocks (1h) ✅

- [x] Créer `getWeeklyTimeBlocks(weekStartDate: Date)`
- [x] Query Prisma avec safe-actions
- [x] Grouper par jour
- [x] Return : `{ monday: [...], tuesday: [...], ... }`

### 7. Navigation Semaines (1h) ✅

- [x] State `currentWeek` (useState)
- [x] Bouton Previous : `subWeeks(currentWeek, 1)`
- [x] Bouton Next : `addWeeks(currentWeek, 1)`
- [x] Re-fetch blocks on week change

### 8. Tests (2h) ✅

- [x] Test affichage semaine courante
- [x] Test navigation prev/next
- [x] Test time blocks positionnés correctement
- [x] Test workHours affichées
- [x] Test responsive (mobile : scroll horizontal)
- [x] E2E tests (weekly.spec.ts)

---

## Critères de Succès

- [x] Weekly View affiche 7 jours
- [x] Navigation semaines fonctionnelle
- [x] Time blocks affichés avec bonnes couleurs (+ pastel dark mode)
- [x] Responsive (scroll horizontal sur mobile)
- [x] i18n complet (EN/FR)
- [x] Tests unitaires et E2E passent
- [x] CI green

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
