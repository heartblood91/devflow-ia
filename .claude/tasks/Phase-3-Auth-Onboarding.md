# Phase 3 : Auth + Onboarding

**Durée :** Semaine 3 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Implémenter authentication (NextAuth)
- [ ] Créer onboarding conversationnel
- [ ] Créer page Settings (chronotype, horaires, War Room)
- [ ] Intégrer GPT-4o-mini pour DevFlow AI

---

## Tasks

### 3.1 Authentication (NextAuth)

**Durée estimée :** 6h

#### Étape 1 : Setup NextAuth

- [ ] Installer NextAuth :
  ```bash
  cd packages/web
  pnpm add next-auth @auth/prisma-adapter bcryptjs
  pnpm add -D @types/bcryptjs
  ```

- [ ] Créer `app/api/auth/[...nextauth]/route.ts` :

```ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] Créer `lib/prisma.ts` :
  ```ts
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = global as unknown as { prisma: PrismaClient };

  export const prisma = globalForPrisma.prisma || new PrismaClient();

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```

#### Étape 2 : Pages Auth

- [ ] Créer `app/login/page.tsx` :
  - Form email/password
  - Validation (Zod)
  - Error handling
  - Lien vers signup

- [ ] Créer `app/signup/page.tsx` :
  - Form email/password/confirm
  - Validation (min 8 chars, etc.)
  - Hash password (bcrypt)
  - Créer User dans DB
  - Redirect vers /onboarding

- [ ] Créer `middleware.ts` (protection routes) :
  ```ts
  import { withAuth } from 'next-auth/middleware';

  export default withAuth({
    callbacks: {
      authorized({ req, token }) {
        // Routes publiques
        if (req.nextUrl.pathname.startsWith('/login')) return true;
        if (req.nextUrl.pathname.startsWith('/signup')) return true;

        // Routes protégées
        return !!token;
      },
    },
  });

  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  };
  ```

**Tests :**
- [ ] Test signup → user créé en DB
- [ ] Test login → session créée
- [ ] Test middleware → redirect si non auth
- [ ] Test logout → session détruite

---

### 3.2 Onboarding Conversationnel

**Durée estimée :** 8h

#### Étape 1 : Setup OpenAI SDK

- [ ] Installer OpenAI SDK :
  ```bash
  pnpm add openai
  ```

- [ ] Créer `.env` variables :
  ```
  OPENAI_API_KEY="sk-..."
  ```

- [ ] Créer `lib/openai.ts` :
  ```ts
  import OpenAI from 'openai';

  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  ```

#### Étape 2 : Page Onboarding

- [ ] Créer `app/onboarding/page.tsx` :
  - UI conversationnelle (bulles chat)
  - Input user
  - Affichage messages AI
  - Progress indicator (étape 1/3, 2/3, 3/3)

- [ ] Créer `app/api/onboarding/chat/route.ts` (Server Action) :

```ts
import { openai } from '@/lib/openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const ONBOARDING_PROMPT = `Tu es DevFlow AI, un assistant qui aide à configurer le profil productivité d'un développeur.

Ton rôle : poser 3 questions pour comprendre son chronotype et ses horaires de travail.

Question 1 (Chronotype) :
"Salut, je suis DevFlow AI. Je vais t'aider à configurer ton système.
Première question : Tu es plutôt du matin ou du soir ?"

Options :
- Matin (chronotype Lion ou Ours)
- Soir (chronotype Loup)
- Ça dépend (chronotype Dauphin)

Question 2 (Horaires de travail) :
"Ok. À quelle heure tu es le plus efficace ?"
- 8h-10h (très matinal)
- 10h-12h (matinal classique)
- 14h-16h (après-midi)
- 16h-18h (fin de journée)
- 20h-23h (soirée)

Question 3 (War Room) :
"Parfait. Tu es chronotype [X].
Ton peak : [horaires].
Je placerai tes tâches difficiles dans ces créneaux.

Dernière question : Quand veux-tu faire ta War Room hebdo (planification) ?
Par défaut : Vendredi 17h"

User peut répondre librement ou choisir option par défaut.

Une fois les 3 questions répondues, tu résumes :
"Top ! Profil configuré :
- Chronotype : [X]
- Horaires de travail : [X]
- War Room : [X]

Tu es prêt. Clique sur 'Terminer' pour accéder au dashboard."

Ton style : friendly, concis, dev-friendly, pas de bullshit.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: ONBOARDING_PROMPT },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const assistantMessage = completion.choices[0].message.content;

  return Response.json({ message: assistantMessage });
}
```

- [ ] Créer Server Action `saveOnboardingPreferences` :
  ```ts
  'use server';

  import { getServerSession } from 'next-auth';
  import { prisma } from '@/lib/prisma';

  export async function saveOnboardingPreferences(data: {
    chronotype: string;
    workHours: { start: string; end: string };
    warRoomSchedule: { day: string; time: string };
  }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: {
          chronotype: data.chronotype,
          workHours: data.workHours,
          warRoomSchedule: data.warRoomSchedule,
          pomodoroLength: 25,
          breakLength: 5,
          ultradianWork: 90,
          ultradianBreak: 20,
          bufferPercentage: 20,
          maxRescuePerWeek: 2,
          optionalEscalationWeeks: 3,
        },
      },
    });

    return { success: true };
  }
  ```

#### Étape 3 : UI Components

- [ ] Créer `components/onboarding/ChatBubble.tsx` :
  - Bubble AI (left, blue)
  - Bubble User (right, gray)

- [ ] Créer `components/onboarding/ChatInput.tsx` :
  - Input + bouton Send
  - Loading state
  - Error handling

- [ ] Créer `components/onboarding/ProgressBar.tsx` :
  - 3 étapes (1/3, 2/3, 3/3)
  - Visual progress

**Tests :**
- [ ] Test conversation complète → preferences sauvegardées
- [ ] Test parsing réponses user (chronotype, horaires)
- [ ] Test edge cases (user répond hors contexte)
- [ ] Test timeout OpenAI API

---

### 3.3 Page Settings

**Durée estimée :** 6h

#### Structure

- [ ] Créer `app/settings/page.tsx` :
  - Tabs : Profil, Horaires, War Room, Récurrentes, Notifications

#### Tab 1 : Profil

- [ ] Section Chronotype :
  - Dropdown : Bear, Lion, Wolf, Dolphin
  - Description de chaque type
  - Peak hours affichées automatiquement

- [ ] Section Informations :
  - Nom
  - Email (read-only)
  - Avatar (optional, V2)

#### Tab 2 : Horaires

- [ ] Section Horaires de travail (par jour) :
  - Lundi : 8h-19h (default)
  - Mardi : 8h-19h
  - ...
  - Samedi : Off (default)
  - Dimanche : Off (default)

- [ ] Customizable via input time pickers
- [ ] Toggle "Jour OFF" pour désactiver un jour

#### Tab 3 : War Room

- [ ] Section Planification hebdo :
  - Jour : Dropdown (Lundi-Dimanche)
  - Heure : Time picker
  - Default : Vendredi 17h

#### Tab 4 : Récurrentes

- [ ] Liste des tâches récurrentes créées
- [ ] Bouton "+ Nouvelle récurrente"
- [ ] Pour chaque récurrente :
  - Titre
  - Fréquence (quotidien/hebdo/mensuel)
  - Jours (si hebdo)
  - Durée estimée
  - Escalade activée (toggle)
  - Si escalade : après combien de skips (dropdown 3-7)
  - Priorité escalade (dropdown Sacred/Important)

#### Tab 5 : Notifications

- [ ] Toggles :
  - ☑️ Notifications push
  - ☑️ Début de tâche (15 min avant)
  - ☑️ Fin de tâche
  - ☑️ Temps restant (30 min avant fin)
  - ☑️ Daily reflection (en fin de journée)
  - ☑️ War Room (veille + 15 min avant)
  - ☑️ Escalade (veille si tâche récurrente non faite)

**Server Actions :**
- [ ] `updateUserPreferences()`
- [ ] `createRecurringTask()`
- [ ] `updateRecurringTask()`
- [ ] `deleteRecurringTask()`

**Tests :**
- [ ] Test update chronotype → preferences saved
- [ ] Test update horaires → saved
- [ ] Test create recurring task → DB
- [ ] Test escalation toggle → logic functional

---

### 3.4 Dashboard Vide (CTA)

**Durée estimée :** 2h

- [ ] Créer `app/dashboard/page.tsx` :
  - Header : "Bienvenue, [Nom]"
  - Empty state : "Tu n'as aucune tâche pour le moment"
  - CTA : "Crée ta première tâche" (bouton)
  - Redirection vers /backlog

**Tests :**
- [ ] Test redirect si pas onboarding fait → /onboarding
- [ ] Test CTA → /backlog

---

## Critères de Succès

- [ ] Auth fonctionnelle (signup, login, logout)
- [ ] Onboarding conversationnel terminé → preferences saved
- [ ] Settings page créée avec 5 tabs
- [ ] User peut changer chronotype, horaires, War Room
- [ ] Dashboard vide affiche CTA
- [ ] Tests unitaires passent (80% coverage)
- [ ] Prêt pour Phase 4 (Backlog + Tasks)

---

## Risques

**Risque 1 : OpenAI API lente (latency)**
- **Impact :** UX dégradée (attente longue)
- **Mitigation :** Afficher loading state, timeout 10s

**Risque 2 : Parsing réponses user imprécises**
- **Impact :** AI ne comprend pas → boucle infinie
- **Mitigation :** Prompt avec exemples, fallback vers options prédéfinies

**Risque 3 : Cost OpenAI (onboarding)**
- **Impact :** Budget exceeded
- **Mitigation :** Limite tokens (max_tokens: 300), caching prompt système

---

## Notes

- Onboarding doit être fluide (< 3 min)
- Ne pas demander trop d'infos (éviter abandon)
- Settings peuvent être modifiés après (pas bloquant)

---

**Prochaine phase :** Phase 4 - Backlog + Tasks Management
