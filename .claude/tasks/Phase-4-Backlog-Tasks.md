# Phase 4 : Backlog + Tasks Management

**Durée :** Semaine 4 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Créer Backlog Kanban (4 colonnes)
- [ ] CRUD Tasks (Create, Read, Update, Delete)
- [ ] Drag & drop entre colonnes
- [ ] Filtres (priorité, difficulté, deadline, quarter)
- [ ] Sous-tâches et dépendances

---

## Tasks

### 4.1 Page Backlog (Layout)

**Durée estimée :** 4h

#### Structure

- [ ] Créer `app/backlog/page.tsx` :
  - Header : "Backlog"
  - Filtres (top bar)
  - 4 colonnes Kanban : Inbox, À faire, En cours, Done
  - Bouton "+ Nouvelle tâche" (top-right)

#### Filtres

- [ ] Créer `components/backlog/Filters.tsx` :
  - Dropdown Priorité : Toutes, 🔴 Sacré, 🟠 Important, 🟢 Facultatif
  - Dropdown Difficulté : Toutes, 1, 2, 3, 4, 5
  - Dropdown Deadline : Toutes, Cette semaine, Ce mois, Ce quarter
  - Dropdown Quarter : Tous, Q1-2026, Q2-2026, Q3-2026, Q4-2026
  - Bouton "Reset filtres"

- [ ] State management (useState ou Zustand) :
  ```ts
  type Filters = {
    priority: Priority | 'all';
    difficulty: number | 'all';
    deadline: 'all' | 'week' | 'month' | 'quarter';
    quarter: string | 'all';
  };
  ```

**Tests :**
- [ ] Test filtres appliqués → tasks filtrées
- [ ] Test reset → toutes les tasks affichées

---

### 4.2 TaskCard Component

**Durée estimée :** 4h

#### Design

- [ ] Créer `components/backlog/TaskCard.tsx` :

```tsx
<Card>
  <CardHeader>
    <Badge priority={task.priority} />  {/* 🔴 🟠 🟢 */}
    <Badge difficulty={task.difficulty} /> {/* 1⭐ - 5⭐ */}
    {task.deadline && <Badge variant="outline">{formatDate(task.deadline)}</Badge>}
  </CardHeader>

  <CardContent>
    <h3>{task.title}</h3>
    {task.description && <p>{task.description}</p>}

    <div className="meta">
      <Clock /> {task.estimatedDuration} min
      {task.quarter && <Tag>{task.quarter}</Tag>}
    </div>

    {task.subtasks?.length > 0 && (
      <div className="subtasks">
        {task.subtasks.length} sous-tâches
      </div>
    )}

    {task.dependencies?.length > 0 && (
      <div className="dependencies">
        ⚠️ {task.dependencies.length} dépendances
      </div>
    )}
  </CardContent>

  <CardFooter>
    <Button variant="ghost" onClick={onEdit}>Éditer</Button>
    <Button variant="ghost" onClick={onDelete}>Supprimer</Button>
  </CardFooter>
</Card>
```

#### Props

```ts
type TaskCardProps = {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
};
```

**Tests :**
- [ ] Test affichage task avec toutes les props
- [ ] Test click edit → ouvre modal
- [ ] Test click delete → confirmation
- [ ] Test drag → draggable

---

### 4.3 Kanban Columns

**Durée estimée :** 6h

#### Structure

- [ ] Créer `components/backlog/KanbanBoard.tsx` :
  - 4 colonnes : Inbox, À faire, En cours, Done
  - Chaque colonne affiche tasks filtrées
  - Drag & drop entre colonnes
  - Empty state si aucune tâche

#### Drag & Drop (dnd-kit ou react-beautiful-dnd)

- [ ] Installer dnd-kit :
  ```bash
  pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  ```

- [ ] Implémenter DndContext :

```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newColumn = over.id as KanbanColumn;

    await updateTaskColumn(taskId, newColumn);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {['inbox', 'todo', 'doing', 'done'].map((column) => (
          <KanbanColumn
            key={column}
            column={column as KanbanColumn}
            tasks={tasks.filter((t) => t.kanbanColumn === column)}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] Créer `components/backlog/KanbanColumn.tsx` :
  ```tsx
  function KanbanColumn({ column, tasks }: { column: KanbanColumn; tasks: Task[] }) {
    return (
      <div className="kanban-column">
        <h2>{column}</h2>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="empty-state">
            Aucune tâche dans cette colonne
          </div>
        )}
      </div>
    );
  }
  ```

**Server Action :**

- [ ] Créer `updateTaskColumn` Server Action :
  ```ts
  'use server';

  import { prisma } from '@/lib/db/prisma';

  export async function updateTaskColumn(taskId: string, newColumn: KanbanColumn) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        kanbanColumn: newColumn,
        status: newColumn === 'done' ? 'done' : 'todo',
        completedAt: newColumn === 'done' ? new Date() : null,
      },
    });

    return { success: true };
  }
  ```

**Tests :**
- [ ] Test drag task → colonne mise à jour en DB
- [ ] Test status auto-update (done → completedAt)
- [ ] Test empty state affichée si colonne vide

---

### 4.4 Modal Création/Édition Task

**Durée estimée :** 8h

#### Structure

- [ ] Créer `components/backlog/TaskModal.tsx` :
  - Modal (shadcn Dialog)
  - Form avec validation (Zod + React Hook Form)
  - Mode : Create ou Edit

#### Form Fields

- [ ] Titre (required, max 100 chars)
- [ ] Description (optional, textarea, max 500 chars)
- [ ] Priorité (dropdown : Sacré, Important, Facultatif)
- [ ] Difficulté (slider 1-5)
- [ ] Durée estimée (input number, minutes)
- [ ] Deadline (date picker, optional)
- [ ] Quarter (dropdown : Q1-2026, Q2-2026, etc.)
- [ ] Sous-tâches (liste, "+ Ajouter sous-tâche")
- [ ] Dépendances (multi-select, autres tasks)

#### Validation Schema (Zod)

```ts
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(['sacred', 'important', 'optional']),
  difficulty: z.number().min(1).max(5),
  estimatedDuration: z.number().min(1).max(480), // max 8h
  deadline: z.date().optional(),
  quarter: z.string().optional(),
  subtasks: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;
```

#### Server Actions

- [ ] Créer `createTask` :
  ```ts
  'use server';

  import { prisma } from '@/lib/db/prisma';
  import { auth } from '@/lib/auth/auth';

  export async function createTask(data: TaskFormData) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        difficulty: data.difficulty,
        estimatedDuration: data.estimatedDuration,
        deadline: data.deadline,
        quarter: data.quarter,
        status: 'inbox',
        kanbanColumn: 'inbox',
        dependencies: data.dependencies || [],
      },
    });

    // Créer sous-tâches si existent
    if (data.subtasks && data.subtasks.length > 0) {
      await prisma.task.createMany({
        data: data.subtasks.map((title) => ({
          userId: session.user.id,
          title,
          priority: data.priority,
          difficulty: data.difficulty,
          estimatedDuration: Math.floor(data.estimatedDuration / data.subtasks.length),
          parentTaskId: task.id,
          status: 'inbox',
          kanbanColumn: 'inbox',
        })),
      });
    }

    return { success: true, taskId: task.id };
  }
  ```

- [ ] Créer `updateTask` :
  ```ts
  'use server';

  import { prisma } from '@/lib/db/prisma';
  import { auth } from '@/lib/auth/auth';

  export async function updateTask(taskId: string, data: Partial<TaskFormData>) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
      },
    });

    return { success: true, task };
  }
  ```
- [ ] Créer `deleteTask` :
  ```ts
  'use server';

  import { prisma } from '@/lib/db/prisma';
  import { auth } from '@/lib/auth/auth';

  export async function deleteTask(taskId: string) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
    return { success: true };
  }
  ```

**UI Details :**

- [ ] Bouton "+ Ajouter sous-tâche" :
  - Ouvre input inline
  - Ajoute à liste subtasks
  - Affiche toutes les sous-tâches dans la form

- [ ] Dépendances multi-select :
  - Liste toutes les tasks (sauf task courante)
  - User peut sélectionner plusieurs
  - Affiche warning si dépendance cyclique détectée

**Tests :**
- [ ] Test create task → task en DB
- [ ] Test create avec sous-tâches → sous-tâches créées
- [ ] Test update task → modifications saved
- [ ] Test delete task → supprimée en DB (+ sous-tâches cascade)
- [ ] Test validation errors → messages affichés
- [ ] Test dépendances cycliques → bloqué

---

### 4.5 Smart Suggestions (Difficulté)

**Durée estimée :** 3h

#### Contexte

User entre titre + description → AI suggère difficulté (1-5)

#### Implementation

- [ ] Créer Server Action `suggestDifficulty` :

```ts
'use server';

import { openai } from '@/lib/openai';

const DIFFICULTY_PROMPT = `Tu es un assistant qui analyse la complexité de tâches de développement.

Règles :
- 1⭐ : Très simple (< 30 min, typo, config triviale)
- 2⭐ : Simple (30 min-1h, bug mineur, feature simple)
- 3⭐ : Moyen (1-3h, feature standard, refacto moyen)
- 4⭐ : Difficile (3-6h, feature complexe, architecture)
- 5⭐ : Très difficile (> 6h, migration, refacto majeur)

Exemples :
- "Fix typo in README" → 1⭐
- "Add logout button" → 2⭐
- "Implement SEPA with Stripe" → 4⭐
- "Migrate from REST to GraphQL" → 5⭐

User task :
Title: {title}
Description: {description}

Réponds UNIQUEMENT avec un nombre (1-5), rien d'autre.`;

export async function suggestDifficulty(title: string, description?: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: DIFFICULTY_PROMPT.replace('{title}', title).replace('{description}', description || ''),
      },
    ],
    temperature: 0.3,
    max_tokens: 10,
  });

  const difficultyStr = completion.choices[0].message.content?.trim();
  const difficulty = parseInt(difficultyStr || '3', 10);

  return Math.min(Math.max(difficulty, 1), 5); // Clamp 1-5
}
```

- [ ] Intégrer dans TaskModal :
  - Bouton "Suggérer difficulté" (icône sparkles)
  - Loading state
  - Auto-fill slider avec suggestion

**Tests :**
- [ ] Test suggestion simple task → 1-2
- [ ] Test suggestion complexe → 4-5
- [ ] Test fallback si API fail → default 3

---

## Critères de Succès

- [ ] Backlog Kanban fonctionnel (4 colonnes)
- [ ] CRUD tasks complet
- [ ] Drag & drop entre colonnes
- [ ] Filtres fonctionnels
- [ ] Sous-tâches et dépendances créées
- [ ] AI suggère difficulté
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 5 (Planning + War Room)

---

## Risques

**Risque 1 : Performance drag & drop (> 100 tasks)**
- **Impact :** Lag, UX dégradée
- **Mitigation :** Virtualisation (react-window), pagination colonnes

**Risque 2 : Dépendances cycliques non détectées**
- **Impact :** Bug planning (boucle infinie)
- **Mitigation :** Validation côté serveur (graph traversal)

**Risque 3 : AI suggestions incorrectes**
- **Impact :** User frustré
- **Mitigation :** Toujours éditable manuellement, feedback loop

---

## Notes

- Backlog doit être rapide (< 300ms chargement)
- UX drag & drop fluide (animations)
- Filtres persistent en localStorage

---

**Prochaine phase :** Phase 5 - Planning + War Room
