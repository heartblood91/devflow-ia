# Phase 8 - Jour 4-5 : Chatbot Conversational + Function Calling

**Durée :** 2 jours
**Statut :** 🟡 À faire
**Dépendances :** Jour 2-3 (AI Proactive)

---

## Objectif

Créer le chatbot DevFlow AI conversationnel avec function calling (actions).

---

## Jour 4 : Chatbot UI + Basic Conversation (8h)

### 1. Chatbot Panel (3h)

- [ ] Créer `components/chatbot/ChatbotPanel.tsx`
- [ ] Slide-in panel from right
- [ ] Trigger : bouton bottom-right (floating)

- [ ] Design :
  ```tsx
  export function ChatbotPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    return (
      <>
        {/* Floating trigger button */}
        <Button
          className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="size-6" />
        </Button>

        {/* Slide-in panel */}
        <div
          className={`fixed top-0 right-0 h-screen w-96 bg-white border-l-4 border-black shadow-2xl transform transition-transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ChatbotHeader onClose={() => setIsOpen(false)} />
          <ChatbotMessages messages={messages} />
          <ChatbotInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
          />
        </div>
      </>
    );
  }
  ```

### 2. Chatbot Components (3h)

- [ ] Créer `components/chatbot/ChatbotHeader.tsx` :
  ```tsx
  <div className="p-4 border-b-2 border-black">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-blue-500 rounded-full flex items-center justify-center">
          <Sparkles className="size-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold">DevFlow AI</h3>
          <p className="text-xs text-gray-500">Toujours là pour t'aider</p>
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={onClose}>
        <X />
      </Button>
    </div>
  </div>
  ```

- [ ] Créer `components/chatbot/ChatbotMessages.tsx` :
  ```tsx
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((message, i) => (
      <MessageBubble key={i} message={message} />
    ))}

    {isLoading && (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="size-4 animate-spin" />
        DevFlow AI réfléchit...
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>
  ```

- [ ] Créer `components/chatbot/MessageBubble.tsx` :
  ```tsx
  type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };

  function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[80%] p-3 rounded-lg ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 border-2 border-black text-black'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          <p className="text-xs opacity-70 mt-1">
            {format(message.timestamp, 'HH:mm')}
          </p>
        </div>
      </div>
    );
  }
  ```

- [ ] Créer `components/chatbot/ChatbotInput.tsx` :
  ```tsx
  <div className="p-4 border-t-2 border-black">
    <div className="flex gap-2">
      <Input
        placeholder="Pose une question..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
      />
      <Button onClick={onSend}>
        <Send />
      </Button>
    </div>

    {/* Quick actions */}
    <div className="flex flex-wrap gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange('Quelle est ma prochaine tâche ?')}
      >
        Prochaine tâche
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange('Montre mes stats de la semaine')}
      >
        Stats
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange('Déplace ma tâche à demain')}
      >
        Déplacer tâche
      </Button>
    </div>
  </div>
  ```

### 3. Basic Conversation API (2h)

- [ ] Créer `app/api/chatbot/route.ts` :
  ```ts
  export async function POST(req: Request) {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    // Get user context
    const context = await getUserContextCached(session.user.id);

    // System prompt
    const systemPrompt = `Tu es DevFlow AI, un assistant productivité pour développeurs.

Contexte user :
${serializeContext(context)}

Ton rôle :
- Répondre aux questions sur le planning, les tâches, les stats
- Donner des conseils productivité
- Aider à prioriser

Ton style :
- Concis (max 3-4 phrases)
- Friendly, dev-oriented
- Actionnable (pas de bullshit)

Exemples :
User: "Quelle est ma prochaine tâche ?"
Assistant: "Prochaine tâche : Bug fix dons (16h-18h). C'est une tâche importante (2⭐). Tu as 2h devant toi."

User: "Je suis fatigué, je fais quoi ?"
Assistant: "Energy level bas ? Prends une pause de 10 min, ou reporte la tâche difficile à demain matin (ton peak : 10h-12h)."`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const assistantMessage = completion.choices[0].message.content;

    return Response.json({ message: assistantMessage });
  }
  ```

---

## Jour 5 : Function Calling (8h)

### 4. Define Tools (3h)

- [ ] Créer `lib/ai/tools.ts`
- [ ] Définir tools pour function calling :
  ```ts
  export const CHATBOT_TOOLS = [
    {
      type: 'function',
      function: {
        name: 'get_next_task',
        description: "Get the user's next scheduled task",
        parameters: {},
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_task_details',
        description: 'Get details of a specific task by title or ID',
        parameters: {
          type: 'object',
          properties: {
            taskIdentifier: {
              type: 'string',
              description: 'Task title or ID',
            },
          },
          required: ['taskIdentifier'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'move_task',
        description: 'Move a task to another day',
        parameters: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The task ID',
            },
            newDate: {
              type: 'string',
              description: 'The new date (YYYY-MM-DD)',
            },
          },
          required: ['taskId', 'newDate'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_weekly_stats',
        description: "Get the user's productivity stats for the current week",
        parameters: {},
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_daily_progress',
        description: "Get today's progress (tasks completed, time spent)",
        parameters: {},
      },
    },
    {
      type: 'function',
      function: {
        name: 'suggest_break',
        description: 'Suggest when to take a break based on current task and energy',
        parameters: {},
      },
    },
  ];
  ```

### 5. Implement Tool Functions (3h)

- [ ] Créer `lib/ai/toolFunctions.ts`
- [ ] Implémenter chaque fonction :
  ```ts
  export async function getNextTask(userId: string) {
    const now = new Date();

    const nextBlock = await prisma.timeBlock.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay(now),
          lt: endOfDay(now),
        },
        startTime: { gte: format(now, 'HH:mm') },
      },
      include: { task: true },
      orderBy: { startTime: 'asc' },
    });

    if (!nextBlock || !nextBlock.task) {
      return { message: 'Aucune tâche planifiée pour le reste de la journée.' };
    }

    return {
      title: nextBlock.task.title,
      startTime: nextBlock.startTime,
      endTime: nextBlock.endTime,
      priority: nextBlock.task.priority,
      difficulty: nextBlock.task.difficulty,
      estimatedDuration: nextBlock.task.estimatedDuration,
    };
  }

  export async function getTaskDetails(userId: string, taskIdentifier: string) {
    const task = await prisma.task.findFirst({
      where: {
        userId,
        OR: [
          { id: taskIdentifier },
          { title: { contains: taskIdentifier, mode: 'insensitive' } },
        ],
      },
    });

    if (!task) {
      return { message: `Tâche "${taskIdentifier}" non trouvée.` };
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      difficulty: task.difficulty,
      estimatedDuration: task.estimatedDuration,
      status: task.status,
      deadline: task.deadline,
    };
  }

  export async function moveTask(userId: string, taskId: string, newDate: string) {
    // Find time block for this task
    const block = await prisma.timeBlock.findFirst({
      where: {
        userId,
        taskId,
      },
    });

    if (!block) {
      return { message: 'Tâche non planifiée.' };
    }

    // Update block date
    await prisma.timeBlock.update({
      where: { id: block.id },
      data: { date: new Date(newDate) },
    });

    return { message: `Tâche déplacée au ${format(new Date(newDate), 'EEEE d MMMM')}.` };
  }

  export async function getWeeklyStats(userId: string) {
    const weekStart = getStartOfWeek(new Date());
    const stats = await calculateWeeklyStats(userId, weekStart);

    return {
      completedTasks: stats.completedTasks,
      totalTasks: stats.totalTasks,
      completionRate: `${stats.completionRate}%`,
      totalHours: `${stats.totalHours}h`,
      avgFocusQuality: `${stats.avgFocusQuality}/5`,
    };
  }

  export async function getDailyProgress(userId: string) {
    const today = new Date();
    const stats = await calculateDailyStats(userId, today);

    return {
      completedTasks: stats.completedTasks,
      totalTasks: stats.totalTasks,
      completionRate: `${stats.completionRate}%`,
      totalHours: `${stats.totalHours}h`,
    };
  }

  export async function suggestBreak(userId: string) {
    const reflection = await prisma.dailyReflection.findUnique({
      where: {
        userId_date: {
          userId,
          date: startOfDay(new Date()),
        },
      },
    });

    const energyLevel = reflection?.energyLevel || 3;

    if (energyLevel <= 2) {
      return { message: 'Energy level bas (2/5). Prends une pause de 15-20 min maintenant.' };
    }

    return { message: 'Energy level OK. Continue ton focus, pause dans 45 min.' };
  }
  ```

### 6. Function Calling Integration (2h)

- [ ] Update `app/api/chatbot/route.ts` avec function calling :
  ```ts
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    tools: CHATBOT_TOOLS,
    temperature: 0.7,
    max_tokens: 300,
  });

  const responseMessage = completion.choices[0].message;

  // Check if AI wants to call a function
  if (responseMessage.tool_calls) {
    const toolCall = responseMessage.tool_calls[0];
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);

    // Execute function
    let functionResult;

    switch (functionName) {
      case 'get_next_task':
        functionResult = await getNextTask(session.user.id);
        break;
      case 'get_task_details':
        functionResult = await getTaskDetails(session.user.id, functionArgs.taskIdentifier);
        break;
      case 'move_task':
        functionResult = await moveTask(session.user.id, functionArgs.taskId, functionArgs.newDate);
        break;
      case 'get_weekly_stats':
        functionResult = await getWeeklyStats(session.user.id);
        break;
      case 'get_daily_progress':
        functionResult = await getDailyProgress(session.user.id);
        break;
      case 'suggest_break':
        functionResult = await suggestBreak(session.user.id);
        break;
      default:
        functionResult = { error: 'Unknown function' };
    }

    // Call AI again with function result
    const secondCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        responseMessage,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return Response.json({ message: secondCompletion.choices[0].message.content });
  }

  // No function call, return AI response directly
  return Response.json({ message: responseMessage.content });
  ```

### 7. Tests (2h)

- [ ] Test chatbot UI ouvre/ferme
- [ ] Test messages envoyés/reçus
- [ ] Test function calling : "Quelle est ma prochaine tâche ?" → get_next_task called
- [ ] Test function calling : "Déplace SEPA à demain" → move_task called
- [ ] Test function calling : "Montre mes stats" → get_weekly_stats called
- [ ] Test quick actions buttons

---

## Critères de Succès

- [ ] Chatbot panel slide-in fonctionnel
- [ ] Messages user/assistant affichés
- [ ] Quick actions buttons
- [ ] Function calling implémenté (6 functions)
- [ ] AI peut query tasks, stats, move tasks
- [ ] Conversation fluide
- [ ] Responsive
- [ ] Tests passent

---

## Design Notes

**Chatbot Panel :**
- Width : 384px (w-96)
- Border-l-4 border-black
- Shadow-2xl
- Slide-in animation smooth (300ms)

**Message Bubbles :**
- User : bg-blue-500 text-white, align right
- Assistant : bg-gray-100 border-2 border-black, align left
- Max-width : 80%
- Rounded-lg

**Floating Button :**
- Size : 56px (size-14)
- Rounded-full
- Shadow-lg
- Position : bottom-6 right-6
- Hover : scale-110

**Quick Actions :**
- Small buttons (size-sm)
- Variant outline
- Gap-2, flex-wrap

---

## Prochaine phase

Phase 9 : Features Avancées (Notifications, Stats, Export, Dark Mode)
