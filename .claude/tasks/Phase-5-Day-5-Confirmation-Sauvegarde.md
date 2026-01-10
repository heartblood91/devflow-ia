# Phase 5 - Jour 5 : Confirmation et Sauvegarde Planning

**Durée :** 1 jour
**Statut :** 🟡 À faire
**Dépendances :** Jour 3-4 (Planification + Algorithm)

---

## Objectif

Permettre au user de valider le planning généré, l'ajuster si besoin, et le sauvegarder en DB.

---

## Tasks

### 1. Bouton "Générer Planning" (1h)

- [ ] Dans War Room modal footer
- [ ] onClick → call `generateWeeklyPlanning()` use case
- [ ] Loading state : "Génération en cours..." (spinner)
- [ ] Success : Planning preview s'affiche
- [ ] Error handling : toast error si fail

### 2. Preview Ajustable (3h)

- [ ] Afficher planning généré dans Weekly Planning Preview
- [ ] User peut encore drag & drop pour ajuster :
  - Déplacer une tâche vers un autre créneau
  - Retirer une tâche (drag back to backlog)
  - Ajouter une tâche manquante

- [ ] State management :
  ```ts
  const [generatedBlocks, setGeneratedBlocks] = useState<TimeBlock[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<TimeBlock[]>([]);

  const finalBlocks = [...generatedBlocks, ...manualAdjustments];
  ```

### 3. Validation Finale (2h)

- [ ] Recalculer charge après chaque ajustement
- [ ] Afficher warnings :
  - ⚠️ Charge > 20h
  - ⚠️ Tâche difficile hors peak hours
  - ⚠️ Pas de buffer time
  - ⚠️ Dépendance non respectée (task B avant task A)

- [ ] Créer `components/weekly/PlanningWarnings.tsx` :
  ```tsx
  <Card className="border-yellow-500">
    <CardHeader>
      <h4>⚠️ Warnings</h4>
    </CardHeader>
    <CardContent>
      <ul>
        {warnings.map((warning, i) => (
          <li key={i} className="text-sm text-yellow-700">
            {warning.message}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
  ```

### 4. Bouton "Confirmer Planning" (2h)

- [ ] Disabled si warnings critiques (charge > 25h)
- [ ] onClick → call `confirmWeeklyPlanning(finalBlocks)`
- [ ] Server Action :
  ```ts
  'use server';

  export async function confirmWeeklyPlanning(timeBlocks: TimeBlock[]) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // 1. Delete existing blocks for next week (si replanning)
    await prisma.timeBlock.deleteMany({
      where: {
        userId: session.user.id,
        date: {
          gte: timeBlocks[0].date,
          lt: addDays(timeBlocks[0].date, 7),
        },
      },
    });

    // 2. Create new blocks
    await prisma.timeBlock.createMany({
      data: timeBlocks.map((tb) => ({
        userId: session.user.id,
        date: tb.date,
        startTime: tb.startTime,
        endTime: tb.endTime,
        type: tb.type,
        priority: tb.priority,
        taskId: tb.taskId,
        taskTitle: tb.taskTitle,
        isFree: tb.isFree || false,
        isRescue: tb.isRescue || false,
      })),
    });

    // 3. Update tasks status → "todo" (planifiées)
    const taskIds = timeBlocks.filter((tb) => tb.taskId).map((tb) => tb.taskId);
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { status: 'todo' },
    });

    return { success: true };
  }
  ```

### 5. Success Flow (1h)

- [ ] Après confirmation :
  - Fermer modal War Room
  - Redirect vers `/weekly`
  - Toast : "✅ Semaine planifiée avec succès"
  - Afficher planning dans Weekly View

### 6. Cancel Flow (1h)

- [ ] Bouton "Annuler" dans modal
- [ ] Confirmation : "Quitter sans sauvegarder ?"
- [ ] Si oui : fermer modal, reset state
- [ ] Si non : rester dans modal

### 7. Persistence State (2h)

- [ ] Si user ferme modal accidentellement :
  - Sauvegarder draft dans localStorage
  - Au reopen : proposer "Reprendre le planning en cours ?"

- [ ] Logic :
  ```ts
  useEffect(() => {
    // Save draft on change
    localStorage.setItem('war-room-draft', JSON.stringify(finalBlocks));
  }, [finalBlocks]);

  useEffect(() => {
    // Load draft on mount
    const draft = localStorage.getItem('war-room-draft');
    if (draft) {
      setShowResumeDraft(true);
    }
  }, []);

  function handleResumeDraft() {
    const draft = localStorage.getItem('war-room-draft');
    setGeneratedBlocks(JSON.parse(draft));
    setShowResumeDraft(false);
  }
  ```

### 8. Tests (2h)

- [ ] Test génération planning → preview affichée
- [ ] Test ajustement manuel → charge recalculée
- [ ] Test warnings affichés si problèmes
- [ ] Test confirmation → blocks saved en DB
- [ ] Test redirect → /weekly affiche planning
- [ ] Test cancel → modal fermée, state reset
- [ ] Test draft persistence → resume fonctionne

---

## Critères de Succès

- [ ] Planning généré automatiquement
- [ ] User peut ajuster manuellement
- [ ] Warnings affichés si problèmes
- [ ] Confirmation sauvegarde en DB
- [ ] Tasks status updated → "todo"
- [ ] Redirect vers Weekly View
- [ ] Draft sauvegardé si fermeture accidentelle

---

## Design Notes

**Bouton "Générer Planning" :**
- Primary button, gros (lg)
- Icon Sparkles (AI)
- Loading : spinner + "Génération en cours..."

**Bouton "Confirmer Planning" :**
- Success button (green)
- Icon CheckCircle
- Disabled state clair (opacity-50, cursor-not-allowed)

**Warnings :**
- Border-l-4 border-yellow-500
- Background bg-yellow-50
- Icon AlertCircle

**Toast Success :**
- Duration 5s
- Icon CheckCircle
- Action button : "Voir planning"

---

## Flow Complet

```
1. User clique "War Room" (vendredi 17h)
2. Modal s'ouvre
3. Rétrospective affichée (stats + AI insights)
4. User clique "Générer Planning"
5. Algorithm tourne (3-5s)
6. Planning preview affichée
7. User ajuste si besoin (drag & drop)
8. Warnings affichés si problèmes
9. User clique "Confirmer Planning"
10. Blocks sauvegardés en DB
11. Tasks status updated
12. Modal se ferme
13. Redirect → /weekly
14. Toast : "✅ Semaine planifiée"
15. Weekly View affiche planning
```

---

## Prochaine phase

Phase 6 : Dashboard Quotidien + Execution + Daily Reflection
