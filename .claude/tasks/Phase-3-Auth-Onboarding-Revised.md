# Phase 3 : Onboarding + Settings (Revised)

**Durée :** Semaine 3 (5 jours)
**Statut :** 🟡 À faire
**Dépendances :** Phase 2 (Prisma models)

---

## Objectifs

- [ ] Créer onboarding conversationnel (DevFlow AI)
- [ ] Créer page Settings (chronotype, horaires, War Room)
- [ ] Intégrer OpenAI GPT-4o-mini
- [ ] Dashboard vide avec CTA

---

## ⚠️ Ce qu'on NE fait PAS

- ❌ Pas de NextAuth setup (Better Auth déjà configuré Phase 0)
- ❌ Pas de nouvelles pages auth (login/signup déjà existants)

---

## Tasks

### 3.1 OpenAI Setup (1h)

- [ ] Install OpenAI SDK :

  ```bash
  pnpm add openai
  ```

- [ ] Créer `lib/ai/openai.ts` :

  ```ts
  import OpenAI from "openai";

  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  ```

- [ ] Ajouter dans `.env` :

  ```
  OPENAI_API_KEY="sk-..."
  ```

- [ ] Test API :
  ```ts
  // Test rapide
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello!" }],
  });
  console.log(completion.choices[0].message.content);
  ```

---

### 3.2 Onboarding Conversationnel (8h)

#### Page Onboarding

- [ ] Créer `app/(auth)/onboarding/page.tsx`
- [ ] UI conversationnelle (bulles chat)
- [ ] Progress indicator (étape 1/3, 2/3, 3/3)

#### Design

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/onboarding/MessageBubble";
import { ChatInput } from "@/components/onboarding/ChatInput";
import { ProgressBar } from "@/components/onboarding/ProgressBar";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Salut, je suis DevFlow AI. Je vais t'aider à configurer ton système.\nPremière question : Tu es plutôt du matin ou du soir ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSend() {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Call API
    const res = await fetch("/api/onboarding/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMessage], step }),
    });

    const { message, nextStep, completed } = await res.json();

    // Add AI message
    setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    setIsLoading(false);

    if (nextStep) setStep(nextStep);

    // If completed, redirect to dashboard
    if (completed) {
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ProgressBar current={step} total={3} />

      <div className="mx-auto w-full max-w-2xl flex-1 p-6">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isLoading && (
            <div className="text-sm text-gray-500">DevFlow AI réfléchit...</div>
          )}
        </div>
      </div>

      <ChatInput value={input} onChange={setInput} onSend={handleSend} />
    </div>
  );
}
```

#### API Route

- [ ] Créer `app/api/onboarding/chat/route.ts` :

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth"; // Better Auth
import { openai } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";

const ONBOARDING_PROMPTS = {
  1: `Tu es DevFlow AI. C'est la question 1/3 (chronotype).

L'user a répondu : {userMessage}

Analyse sa réponse et détermine son chronotype :
- Matin → Bear ou Lion
- Soir → Wolf
- Variable → Dolphin

Réponds de façon friendly et donne la question 2 :
"Ok. À quelle heure tu es le plus efficace ?
- 8h-10h (très matinal)
- 10h-12h (matinal classique)
- 14h-16h (après-midi)
- 16h-18h (fin de journée)
- 20h-23h (soirée)"

Sauvegarde le chronotype détecté.`,

  2: `Tu es DevFlow AI. C'est la question 2/3 (horaires de travail).

Chronotype détecté : {chronotype}
L'user a répondu : {userMessage}

Analyse sa réponse et détermine ses peak hours.

Réponds friendly et confirme son chronotype + peak hours.
Puis donne la question 3 :
"Dernière question : Quand veux-tu faire ta War Room hebdo (planification) ?
Par défaut : Vendredi 17h"`,

  3: `Tu es DevFlow AI. C'est la question 3/3 (War Room).

L'user a répondu : {userMessage}

Parse sa réponse pour extraire jour + heure (défaut : friday 17:00).

Réponds friendly et résume :
"Top ! Profil configuré :
- Chronotype : {chronotype}
- Peak hours : {peakHours}
- War Room : {warRoomDay} {warRoomTime}

Tu es prêt. Clique sur 'Terminer' pour accéder au dashboard."`,
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, step } = await req.json();

  const userMessage = messages[messages.length - 1].content;

  // Get existing preferences to build context
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const prefs = (user?.preferences as any) || {};

  // Build prompt
  const prompt = ONBOARDING_PROMPTS[step as keyof typeof ONBOARDING_PROMPTS]
    .replace("{userMessage}", userMessage)
    .replace("{chronotype}", prefs.chronotype || "")
    .replace("{peakHours}", prefs.peakHours || "")
    .replace("{warRoomDay}", prefs.warRoomSchedule?.day || "")
    .replace("{warRoomTime}", prefs.warRoomSchedule?.time || "");

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  });

  const assistantMessage = completion.choices[0].message.content || "";

  // Parse and save preferences
  let nextStep = step + 1;
  let completed = false;

  if (step === 1) {
    // Parse chronotype
    const chronotype = parseChronotype(userMessage);
    await updateUserPreferences(session.user.id, { chronotype });
  } else if (step === 2) {
    // Parse peak hours
    const peakHours = parsePeakHours(userMessage);
    await updateUserPreferences(session.user.id, { peakHours });
  } else if (step === 3) {
    // Parse War Room schedule
    const warRoomSchedule = parseWarRoomSchedule(userMessage);
    await updateUserPreferences(session.user.id, {
      warRoomSchedule,
      onboardingCompleted: true,
    });
    completed = true;
  }

  return NextResponse.json({
    message: assistantMessage,
    nextStep: completed ? null : nextStep,
    completed,
  });
}

function parseChronotype(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("matin")) return "bear";
  if (lower.includes("soir")) return "wolf";
  return "dolphin";
}

function parsePeakHours(message: string): string {
  // Simple parsing (améliorer si besoin)
  if (message.includes("8h") || message.includes("10h")) return "10:00-12:00";
  if (message.includes("14h") || message.includes("16h")) return "14:00-16:00";
  if (message.includes("20h")) return "20:00-22:00";
  return "10:00-12:00"; // default
}

function parseWarRoomSchedule(message: string): { day: string; time: string } {
  // Simple parsing (améliorer si besoin)
  return { day: "friday", time: "17:00" }; // default
}

async function updateUserPreferences(userId: string, data: any) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const currentPrefs = (user?.preferences as any) || {};

  await prisma.user.update({
    where: { id: userId },
    data: {
      preferences: {
        ...currentPrefs,
        ...data,
        // Defaults
        pomodoroLength: 25,
        breakLength: 5,
        ultradianWork: 90,
        ultradianBreak: 20,
        bufferPercentage: 20,
        maxRescuePerWeek: 2,
        workHours: {
          monday: { start: "08:00", end: "19:00" },
          tuesday: { start: "08:00", end: "19:00" },
          wednesday: { start: "08:00", end: "19:00" },
          thursday: { start: "08:00", end: "19:00" },
          friday: { start: "08:00", end: "19:00" },
          saturday: null,
          sunday: null,
        },
      },
    },
  });
}
```

#### Components

- [ ] Créer `components/onboarding/MessageBubble.tsx`
- [ ] Créer `components/onboarding/ChatInput.tsx`
- [ ] Créer `components/onboarding/ProgressBar.tsx`

---

### 3.3 Page Settings (6h)

- [ ] Créer `app/settings/page.tsx`
- [ ] Tabs : Profil, Horaires, War Room, Récurrentes, Notifications

#### Structure

```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { HoursTab } from "@/components/settings/HoursTab";
import { WarRoomTab } from "@/components/settings/WarRoomTab";
import { RecurringTab } from "@/components/settings/RecurringTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="hours">Horaires</TabsTrigger>
          <TabsTrigger value="warroom">War Room</TabsTrigger>
          <TabsTrigger value="recurring">Récurrentes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="hours">
          <HoursTab />
        </TabsContent>

        <TabsContent value="warroom">
          <WarRoomTab />
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Tabs Components (créer chacun)

1. **ProfileTab** : Chronotype dropdown, nom, email
2. **HoursTab** : Horaires par jour (time pickers)
3. **WarRoomTab** : Jour + heure War Room
4. **RecurringTab** : Liste récurrentes + gestion escalade
5. **NotificationsTab** : Toggles notifications

#### Server Actions

- [ ] Créer `lib/actions/settings.ts` :

  ```ts
  "use server";

  import { auth } from "@/lib/auth/auth";
  import { prisma } from "@/lib/db/prisma";

  export async function updateUserPreferences(data: any) {
    const session = await auth.api.getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferences: data },
    });

    return { success: true };
  }
  ```

---

### 3.4 Dashboard Vide (2h)

- [ ] Créer `app/dashboard/page.tsx` (simple pour l'instant)
- [ ] Empty state si pas de tâches
- [ ] CTA "Crée ta première tâche" → redirect `/backlog`

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage() {
  const session = await auth.api.getSession();
  if (!session?.user) redirect("/login");

  // Check if onboarding completed
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const prefs = user?.preferences as any;
  if (!prefs?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Bienvenue, {session.user.name}
      </h1>

      <div className="mx-auto mt-20 max-w-md text-center">
        <p className="mb-6 text-gray-600">
          Tu n'as aucune tâche pour le moment
        </p>
        <a
          href="/backlog"
          className="inline-block border-2 border-black bg-black px-6 py-3 font-bold text-white hover:bg-white hover:text-black"
        >
          Crée ta première tâche
        </a>
      </div>
    </div>
  );
}
```

---

### 3.5 Tests (2h)

- [ ] Test onboarding flow complet → preferences saved
- [ ] Test settings update → preferences updated
- [ ] Test dashboard redirect si pas onboarding

---

## Critères de Succès

- [ ] Onboarding conversationnel terminé → preferences saved
- [ ] Settings page créée avec 5 tabs
- [ ] User peut changer chronotype, horaires, War Room
- [ ] Dashboard vide affiche CTA
- [ ] Tests Vitest passent
- [ ] Prêt pour Phase 4 (Backlog + Tasks)

---

## Notes

- Better Auth déjà configuré (Phase 0), on l'utilise juste
- OpenAI GPT-4o-mini pour onboarding conversationnel
- Preferences stockées en JSON (flexible pour MVP)

---

**Prochaine phase :** Phase 4 - Backlog + Tasks Management
