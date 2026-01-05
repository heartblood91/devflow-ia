# Phase 7 : DevFlow CLI

**Durée :** Semaine 8 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Créer CLI DevFlow (Node.js)
- [ ] Commandes CRUD tasks (add, list, update, delete)
- [ ] Authentification CLI → DevFlow API
- [ ] Workspace Claude Code (task-creator.md)
- [ ] Flow complet : Voice → Transcript → Claude Code → CLI → DevFlow

---

## Tasks

### 7.1 Setup CLI (Commander.js)

**Durée estimée :** 4h

#### Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── auth.ts        # login, logout, whoami
│   │   ├── tasks.ts       # add, list, update, delete, show
│   │   ├── planning.ts    # plan, week
│   │   └── stats.ts       # stats, insights
│   ├── utils/
│   │   ├── api.ts         # API client
│   │   ├── config.ts      # Config management (~/.devflow/config.json)
│   │   ├── logger.ts      # Console logging
│   │   └── prompts.ts     # Interactive prompts
│   ├── types/
│   │   └── index.ts
│   └── index.ts           # Entry point
├── tests/
├── package.json
└── tsconfig.json
```

#### Setup

- [ ] Installer dependencies :
  ```bash
  cd packages/cli
  pnpm add commander chalk inquirer axios dotenv
  pnpm add -D @types/inquirer @types/node tsx
  ```

- [ ] Créer `src/index.ts` :

```ts
#!/usr/bin/env node

import { program } from 'commander';
import { authCommands } from './commands/auth';
import { taskCommands } from './commands/tasks';
import { planningCommands } from './commands/planning';
import { statsCommands } from './commands/stats';

program
  .name('devflow')
  .description('DevFlow CLI - Productivity system for 10x developers')
  .version('1.0.0');

// Auth commands
program
  .command('login')
  .description('Login to DevFlow')
  .action(authCommands.login);

program
  .command('logout')
  .description('Logout from DevFlow')
  .action(authCommands.logout);

program
  .command('whoami')
  .description('Show current user')
  .action(authCommands.whoami);

// Task commands
program
  .command('add <title>')
  .description('Create a new task')
  .option('-d, --description <description>', 'Task description')
  .option('-p, --priority <priority>', 'Priority (sacred/important/optional)', 'optional')
  .option('--difficulty <difficulty>', 'Difficulty (1-5)', '3')
  .option('-e, --estimate <minutes>', 'Estimated duration (minutes)')
  .option('--deadline <date>', 'Deadline (YYYY-MM-DD)')
  .option('-q, --quarter <quarter>', 'Quarter (Q1-2026, etc.)')
  .action(taskCommands.add);

program
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter by status (inbox/todo/doing/done)')
  .option('-p, --priority <priority>', 'Filter by priority')
  .action(taskCommands.list);

program
  .command('show <taskId>')
  .description('Show task details')
  .action(taskCommands.show);

program
  .command('update <taskId>')
  .description('Update a task')
  .option('-t, --title <title>', 'New title')
  .option('-p, --priority <priority>', 'New priority')
  .option('--status <status>', 'New status')
  .action(taskCommands.update);

program
  .command('delete <taskId>')
  .description('Delete a task')
  .option('-f, --force', 'Skip confirmation')
  .action(taskCommands.delete);

// Planning commands
program
  .command('plan')
  .description('Generate weekly planning')
  .action(planningCommands.plan);

program
  .command('week')
  .description('Show current week planning')
  .action(planningCommands.week);

// Stats commands
program
  .command('stats')
  .description('Show productivity stats')
  .option('-w, --week', 'Show weekly stats')
  .option('-m, --month', 'Show monthly stats')
  .action(statsCommands.stats);

program.parse(process.argv);
```

- [ ] Créer `package.json` scripts :
  ```json
  {
    "name": "@devflow/cli",
    "version": "1.0.0",
    "bin": {
      "devflow": "./dist/index.js"
    },
    "scripts": {
      "dev": "tsx src/index.ts",
      "build": "tsc",
      "link": "npm link"
    }
  }
  ```

**Tests :**
- [ ] Test `devflow --help` → affiche commands
- [ ] Test `devflow --version` → affiche version

---

### 7.2 Auth Commands

**Durée estimée :** 4h

#### Login

- [ ] Créer `src/commands/auth.ts` :

```ts
import inquirer from 'inquirer';
import chalk from 'chalk';
import { apiClient } from '../utils/api';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export const authCommands = {
  async login() {
    logger.info('Login to DevFlow');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => input.includes('@') || 'Invalid email',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
      },
    ]);

    try {
      const { token, user } = await apiClient.post('/auth/login', answers);

      config.set('token', token);
      config.set('user', user);

      logger.success(`Logged in as ${chalk.bold(user.email)}`);
    } catch (error) {
      logger.error('Login failed:', error.message);
      process.exit(1);
    }
  },

  async logout() {
    config.clear();
    logger.success('Logged out');
  },

  async whoami() {
    const user = config.get('user');

    if (!user) {
      logger.error('Not logged in. Run `devflow login` first.');
      process.exit(1);
    }

    logger.info(`Logged in as ${chalk.bold(user.email)}`);
    logger.info(`User ID: ${user.id}`);
  },
};
```

#### Config Management

- [ ] Créer `src/utils/config.ts` :

```ts
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.devflow');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

class Config {
  private data: Record<string, any> = {};

  constructor() {
    this.load();
  }

  load() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      this.data = JSON.parse(raw);
    }
  }

  save() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.data, null, 2));
  }

  get(key: string) {
    return this.data[key];
  }

  set(key: string, value: any) {
    this.data[key] = value;
    this.save();
  }

  clear() {
    this.data = {};
    this.save();
  }
}

export const config = new Config();
```

#### API Client

- [ ] Créer `src/utils/api.ts` :

```ts
import axios, { AxiosInstance } from 'axios';
import { config } from './config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.DEVFLOW_API_URL || 'https://devflow.vercel.app/api',
      timeout: 10000,
    });

    // Interceptor: Add auth token
    this.client.interceptors.request.use((config) => {
      const token = config.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor: Handle errors
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized. Run `devflow login` first.');
        }
        throw new Error(error.response?.data?.message || error.message);
      }
    );
  }

  async get(url: string, params?: any) {
    return this.client.get(url, { params });
  }

  async post(url: string, data?: any) {
    return this.client.post(url, data);
  }

  async put(url: string, data?: any) {
    return this.client.put(url, data);
  }

  async delete(url: string) {
    return this.client.delete(url);
  }
}

export const apiClient = new ApiClient();
```

**Tests :**
- [ ] Test login → token saved in ~/.devflow/config.json
- [ ] Test whoami → affiche user email
- [ ] Test logout → config cleared

---

### 7.3 Task Commands

**Durée estimée :** 6h

#### Add Task

- [ ] Créer `src/commands/tasks.ts` :

```ts
import chalk from 'chalk';
import inquirer from 'inquirer';
import { apiClient } from '../utils/api';
import { logger } from '../utils/logger';

export const taskCommands = {
  async add(title: string, options: any) {
    logger.info(`Creating task: ${chalk.bold(title)}`);

    // If estimate not provided, ask
    let estimate = options.estimate;
    if (!estimate) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'estimate',
          message: 'Estimated duration (minutes):',
          default: '60',
          validate: (input) => !isNaN(parseInt(input)) || 'Must be a number',
        },
      ]);
      estimate = parseInt(answer.estimate);
    }

    try {
      const task = await apiClient.post('/tasks', {
        title,
        description: options.description,
        priority: options.priority,
        difficulty: parseInt(options.difficulty),
        estimatedDuration: parseInt(estimate),
        deadline: options.deadline ? new Date(options.deadline) : undefined,
        quarter: options.quarter,
      });

      logger.success(`Task created: ${chalk.bold(task.title)}`);
      logger.info(`Task ID: ${task.id}`);
    } catch (error) {
      logger.error('Failed to create task:', error.message);
      process.exit(1);
    }
  },

  async list(options: any) {
    try {
      const tasks = await apiClient.get('/tasks', {
        status: options.status,
        priority: options.priority,
      });

      if (tasks.length === 0) {
        logger.info('No tasks found.');
        return;
      }

      logger.info(`Found ${chalk.bold(tasks.length)} tasks:\n`);

      tasks.forEach((task: any) => {
        const priorityIcon = {
          sacred: '🔴',
          important: '🟠',
          optional: '🟢',
        }[task.priority];

        const difficultyStars = '⭐'.repeat(task.difficulty);

        console.log(
          `${priorityIcon} ${chalk.bold(task.title)} ${difficultyStars}`
        );
        console.log(
          `   ID: ${task.id} | Status: ${task.status} | ${task.estimatedDuration} min`
        );
        if (task.deadline) {
          console.log(`   Deadline: ${new Date(task.deadline).toLocaleDateString()}`);
        }
        console.log('');
      });
    } catch (error) {
      logger.error('Failed to list tasks:', error.message);
      process.exit(1);
    }
  },

  async show(taskId: string) {
    try {
      const task = await apiClient.get(`/tasks/${taskId}`);

      console.log('');
      console.log(chalk.bold(task.title));
      console.log('─'.repeat(task.title.length));
      console.log('');
      console.log(`ID:           ${task.id}`);
      console.log(`Priority:     ${task.priority}`);
      console.log(`Difficulty:   ${'⭐'.repeat(task.difficulty)}`);
      console.log(`Status:       ${task.status}`);
      console.log(`Estimate:     ${task.estimatedDuration} min`);
      if (task.deadline) {
        console.log(`Deadline:     ${new Date(task.deadline).toLocaleDateString()}`);
      }
      if (task.quarter) {
        console.log(`Quarter:      ${task.quarter}`);
      }
      if (task.description) {
        console.log('');
        console.log('Description:');
        console.log(task.description);
      }
      console.log('');
    } catch (error) {
      logger.error('Failed to show task:', error.message);
      process.exit(1);
    }
  },

  async update(taskId: string, options: any) {
    try {
      const updates: any = {};

      if (options.title) updates.title = options.title;
      if (options.priority) updates.priority = options.priority;
      if (options.status) updates.status = options.status;

      const task = await apiClient.put(`/tasks/${taskId}`, updates);

      logger.success(`Task updated: ${chalk.bold(task.title)}`);
    } catch (error) {
      logger.error('Failed to update task:', error.message);
      process.exit(1);
    }
  },

  async delete(taskId: string, options: any) {
    if (!options.force) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete this task?',
          default: false,
        },
      ]);

      if (!answer.confirm) {
        logger.info('Cancelled.');
        return;
      }
    }

    try {
      await apiClient.delete(`/tasks/${taskId}`);
      logger.success('Task deleted.');
    } catch (error) {
      logger.error('Failed to delete task:', error.message);
      process.exit(1);
    }
  },
};
```

**Tests :**
- [ ] Test `devflow add "SEPA Backend" -p sacred --difficulty 4 -e 180`
- [ ] Test `devflow list` → affiche tasks
- [ ] Test `devflow show <taskId>` → affiche détails
- [ ] Test `devflow update <taskId> --status done`
- [ ] Test `devflow delete <taskId>` → confirmation

---

### 7.4 API Endpoints (Backend)

**Durée estimée :** 4h

#### Create Endpoints

- [ ] Créer `app/api/tasks/route.ts` :

```ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      ...(status && { status }),
      ...(priority && { priority }),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return Response.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      difficulty: body.difficulty,
      estimatedDuration: body.estimatedDuration,
      deadline: body.deadline,
      quarter: body.quarter,
      status: 'inbox',
      kanbanColumn: 'inbox',
    },
  });

  return Response.json(task);
}
```

- [ ] Créer `app/api/tasks/[taskId]/route.ts` :

```ts
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: {
      id: params.taskId,
      userId: session.user.id,
    },
  });

  if (!task) {
    return new Response('Task not found', { status: 404 });
  }

  return Response.json(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();

  const task = await prisma.task.update({
    where: {
      id: params.taskId,
      userId: session.user.id,
    },
    data: body,
  });

  return Response.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  await prisma.task.delete({
    where: {
      id: params.taskId,
      userId: session.user.id,
    },
  });

  return new Response('Task deleted', { status: 200 });
}
```

**Tests :**
- [ ] Test GET /api/tasks → returns tasks
- [ ] Test POST /api/tasks → creates task
- [ ] Test GET /api/tasks/:id → returns task
- [ ] Test PUT /api/tasks/:id → updates task
- [ ] Test DELETE /api/tasks/:id → deletes task

---

### 7.5 Workspace Claude Code (task-creator)

**Durée estimée :** 4h

#### Flow Complet

```
1. User brainstorme vocalement (ChatGPT Voice + Whisper)
2. Transcript sauvegardé dans ~/devflow-workspace/transcripts/brainstorm-2026-01-05.md
3. User ouvre Claude Code
4. User: "Claude, utilise task-creator pour importer mes tâches"
5. Claude Code lit .claude/task-creator.md + transcript
6. Claude Code parse les tâches du transcript
7. Claude Code génère commandes CLI DevFlow
8. User valide
9. Claude Code exécute commandes → Tâches créées dans DevFlow
```

#### Workspace Structure

- [ ] Créer workspace dir :
  ```bash
  mkdir -p ~/devflow-workspace/transcripts
  mkdir -p ~/devflow-workspace/.claude
  ```

- [ ] Créer `~/devflow-workspace/.claude/task-creator.md` :

````markdown
# Task Creator - DevFlow

Tu es un assistant qui aide à importer des tâches dans DevFlow à partir de transcripts vocaux.

## Ton rôle

1. Lire le transcript fourni par l'user
2. Parser toutes les tâches mentionnées
3. Pour chaque tâche, extraire :
   - Titre (concis, max 100 chars)
   - Description (optionnel)
   - Priorité (sacred/important/optional)
   - Difficulté estimée (1-5)
   - Durée estimée (minutes)
   - Deadline (si mentionné)
   - Quarter (si mentionné)
4. Générer commandes CLI DevFlow
5. Demander validation à l'user
6. Exécuter les commandes

## Exemples

### Transcript 1
```
User: "Bon, je dois implémenter le SEPA avec Stripe, c'est urgent et compliqué.
Je pense que ça va prendre 3h. Il y a aussi un bug sur les dons récurrents,
c'est simple mais important, 30 min max. Et puis je veux refacto le composant Navbar,
c'est pas urgent, 1h."
```

### Parsing
```
Tâche 1 :
- Titre : Implémenter SEPA avec Stripe
- Priorité : sacred (urgent)
- Difficulté : 4 (compliqué)
- Durée : 180 min (3h)

Tâche 2 :
- Titre : Fix bug dons récurrents
- Priorité : important
- Difficulté : 2 (simple)
- Durée : 30 min

Tâche 3 :
- Titre : Refacto composant Navbar
- Priorité : optional (pas urgent)
- Difficulté : 3
- Durée : 60 min (1h)
```

### Commandes CLI
```bash
devflow add "Implémenter SEPA avec Stripe" -p sacred --difficulty 4 -e 180
devflow add "Fix bug dons récurrents" -p important --difficulty 2 -e 30
devflow add "Refacto composant Navbar" -p optional --difficulty 3 -e 60
```

## Questions de clarification

Si des infos manquent, pose des questions :
- "Quelle est la priorité de [tâche] ?"
- "Combien de temps estimes-tu pour [tâche] ?"
- "Y a-t-il une deadline pour [tâche] ?"

## Output

Format final :
```
J'ai identifié 3 tâches. Voici les commandes CLI :

1. devflow add "..." -p sacred --difficulty 4 -e 180
2. devflow add "..." -p important --difficulty 2 -e 30
3. devflow add "..." -p optional --difficulty 3 -e 60

Valides-tu ?
```

Si user valide → exécute les commandes.
````

#### Exemple d'utilisation

- [ ] User crée transcript :
  ```bash
  cd ~/devflow-workspace/transcripts
  echo "Je dois faire le SEPA (urgent, 3h), fix bug dons (30 min), refacto Navbar (1h)." > brainstorm-2026-01-05.md
  ```

- [ ] User ouvre Claude Code :
  ```bash
  cd ~/devflow-workspace
  claude-code
  ```

- [ ] User :
  ```
  Claude, utilise task-creator pour importer les tâches du transcript brainstorm-2026-01-05.md
  ```

- [ ] Claude Code :
  1. Lit `.claude/task-creator.md`
  2. Lit `transcripts/brainstorm-2026-01-05.md`
  3. Parse tâches
  4. Génère commandes
  5. Demande validation
  6. Exécute via Bash tool

**Tests :**
- [ ] Test parsing transcript → tâches extraites
- [ ] Test génération commandes CLI → syntaxe correcte
- [ ] Test exécution → tâches créées dans DevFlow

---

## Critères de Succès

- [ ] CLI DevFlow installable (`npm link`)
- [ ] Commandes auth fonctionnelles (login, logout, whoami)
- [ ] Commandes tasks fonctionnelles (add, list, show, update, delete)
- [ ] API endpoints créés et testés
- [ ] Workspace Claude Code configuré
- [ ] Flow complet Voice → Transcript → CLI testé
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 8 (DevFlow AI)

---

## Risques

**Risque 1 : Parsing transcript imprécis**
- **Impact :** Tâches mal créées
- **Mitigation :** Toujours valider avec user avant exécution

**Risque 2 : CLI authentication complexe**
- **Impact :** User frustré
- **Mitigation :** JWT simple, stored in ~/.devflow/config.json

**Risque 3 : API rate limiting**
- **Impact :** CLI bloqué
- **Mitigation :** Ajouter retry logic avec backoff

---

## Notes

- CLI doit être rapide (< 500ms par commande)
- Output CLI coloré (chalk) pour UX
- Workspace task-creator réutilisable pour autres use cases

---

**Prochaine phase :** Phase 8 - DevFlow AI Proactive
