# Phase 1 : Validation & Design

**Durée :** Semaine 1 (5 jours)
**Statut :** ⏭️ Skipped (using NOW.TS boilerplate design patterns)
**Responsable :** Cédric (CEO) + Jean-Claude (PM)
**Note :** Design handled through existing boilerplate patterns and iterative development

---

## Objectifs

- [ ] Valider le PRD complet
- [ ] Créer wireframes basse fidélité
- [ ] Designer user flows
- [ ] Définir design system

---

## Tasks

### 1.1 Validation PRD

**Durée estimée :** 2h

- [ ] Review complet PRD v2.0 avec Cédric
- [ ] Discussion points clés :
  - War Room vendredi (pas dimanche) ✓
  - Récurrentes avec escalade ✓
  - Notifications push ✓
  - CLI + workspace ✓
- [ ] Ajustements si nécessaires
- [ ] **Go/No-Go décision finale**

**Critères de validation :**

- Cédric comprend et valide chaque section
- Pas de désaccord majeur sur le scope
- Budget OK (~$90/mois)
- Timeline réaliste (12 semaines)

---

### 1.2 Wireframes (Figma low-fi)

**Durée estimée :** 8h

#### Dashboard Quotidien

- [ ] Header (date, user)
- [ ] Section "Tes priorités du jour" (3 tâches max, icône Frog)
- [ ] Timeline de la journée (time blocks)
- [ ] Progression (barre %)
- [ ] Chatbot DevFlow AI (bottom-right)

#### Weekly View / War Room

- [ ] Calendrier semaine (lun-dim)
- [ ] Time blocks avec code couleur (🔴🟠🟢⚪⚠️)
- [ ] Sidebar : liste tâches planifiées
- [ ] Modal War Room (rétrospective + planification)
- [ ] Drag & drop zones

#### Backlog Kanban

- [ ] 4 colonnes (Inbox, À faire, En cours, Done)
- [ ] TaskCard (titre, priorité, difficulté, deadline)
- [ ] Filtres (priorité, difficulté, deadline, quarter)
- [ ] Bouton "+ Nouvelle tâche"
- [ ] Drag & drop entre colonnes

#### Settings

- [ ] Tabs (Profil, Horaires, War Room, Récurrentes, Notifications)
- [ ] Section Profil (chronotype dropdown)
- [ ] Section Horaires (par jour, customizable)
- [ ] Section War Room (jour + heure)
- [ ] Section Récurrentes (liste + gestion escalade)
- [ ] Section Notifications (toggles)

#### Onboarding Conversationnel

- [ ] Écran bienvenue
- [ ] Interface chat (bulles)
- [ ] Questions DevFlow AI (chronotype, horaires, War Room)
- [ ] Progress indicator (étape 1/3, 2/3, 3/3)

#### Timer

- [ ] Choix mode (Pomodoro / Ultradian)
- [ ] Timer countdown (grand, visible)
- [ ] Boutons (Start, Pause, Stop)
- [ ] Mode Focus (fullscreen, distraction-free)

**Outils :**

- Figma (compte gratuit)
- Low-fidelity (pas de couleurs, juste wireframes)

---

### 1.3 User Flows

**Durée estimée :** 4h

#### Flow 1 : Onboarding Complet

```
Signup (email/password)
  ↓
Onboarding conversationnel
  → Q1: Chronotype ? (Ours/Lion/Loup/Dauphin)
  → Q2: Horaires travail ? (8h-19h par défaut)
  → Q3: War Room ? (Vendredi 17h par défaut)
  ↓
Dashboard (vide, CTA "Crée ta première tâche")
```

#### Flow 2 : War Room (Vendredi)

```
Notification (16h45): "War Room dans 15 min"
  ↓
Modal War Room (17h00)
  → Rétrospective semaine passée (stats auto)
  → Insights DevFlow AI
  → Drag & drop tâches (Backlog → Semaine)
  → Validation charge (max 20h)
  ↓
Planning généré
  → Weekly View affiche la semaine
  ↓
Confirmation "Semaine planifiée ✓"
```

#### Flow 3 : Daily Planning (Matin)

```
Notification (8h30): "Tes priorités du jour"
  ↓
Dashboard
  → 3 priorités affichées (Frog en premier)
  → Timeline de la journée
  ↓
User clique "Commencer la journée"
  → Première tâche (Frog) active
```

#### Flow 4 : Execution (Journée avec Timer)

```
User clique sur tâche "SEPA Backend"
  ↓
Modal choix timer (Pomodoro / Ultradian)
  → User choisit Ultradian (90/20)
  ↓
Timer démarre (countdown 1h30)
  → Mode Focus activé (fullscreen)
  → Notifications bloquées
  ↓
Timer sonne (11h30)
  → "Pause obligatoire 20 min"
  ↓
Retour après pause
  → "Continuer 30 min ?" ou "Terminer tâche ?"
  ↓
Tâche terminée
  → "Prochaine : Bug fix dons (16h-18h)"
```

#### Flow 5 : Import Vocal → CLI → Backlog

```
User brainstorme (ChatGPT + Whisper)
  ↓
Transcript sauvegardé (~/devflow-workspace/transcripts/)
  ↓
Claude Code : "Utilise task-creator"
  → Lit .claude/task-creator.md + transcript
  → Parse les tâches
  → Pose questions clarification
  ↓
Génère commandes CLI
  → devflow add "SEPA" --estimate "15h" --difficulty 4
  → devflow add "Refacto" --estimate "8h" --difficulty 5
  ↓
User valide
  ↓
Tâches créées dans DevFlow
  → Apparaissent dans Backlog (colonne Inbox)
```

**Outils :**

- Miro ou Figma (flowcharts)
- Format : User action → System response

---

### 1.4 Design System

**Durée estimée :** 4h

#### Palette de Couleurs

**Priorités :**

- 🔴 Sacré : `#EF4444` (red-500)
- 🟠 Important : `#F97316` (orange-500)
- 🟢 Facultatif : `#10B981` (green-500)
- ⚪ Créneau libre : `#F3F4F6` (gray-100)
- ⚠️ Créneau secours : `#FBBF24` (yellow-400)

**UI Base :**

- Background : `#FFFFFF` (white)
- Surface : `#F9FAFB` (gray-50)
- Border : `#E5E7EB` (gray-200)
- Text primary : `#111827` (gray-900)
- Text secondary : `#6B7280` (gray-500)

**Accent :**

- Primary : `#3B82F6` (blue-500)
- Success : `#10B981` (green-500)
- Warning : `#F59E0B` (amber-500)
- Error : `#EF4444` (red-500)

#### Typographie

**Font Family :**

- Inter (Google Fonts) ou Geist (Vercel)

**Scale :**

- Heading 1 : 2.25rem (36px), Bold
- Heading 2 : 1.875rem (30px), Semibold
- Heading 3 : 1.5rem (24px), Semibold
- Body : 1rem (16px), Regular
- Small : 0.875rem (14px), Regular
- Tiny : 0.75rem (12px), Regular

#### Spacing

- xs : 0.25rem (4px)
- sm : 0.5rem (8px)
- md : 1rem (16px)
- lg : 1.5rem (24px)
- xl : 2rem (32px)
- 2xl : 3rem (48px)

#### Composants de Base (shadcn/ui)

- [ ] Button (primary, secondary, ghost, destructive)
- [ ] Input (text, email, number)
- [ ] Select (dropdown)
- [ ] Checkbox
- [ ] Radio
- [ ] Card
- [ ] Modal (Dialog)
- [ ] Toast (notifications)
- [ ] Badge (priority, difficulty)
- [ ] Avatar (user)

#### Icônes

- Lucide React (cohérent, lightweight)
- Icons clés :
  - Calendar (weekly view)
  - CheckCircle (tâche terminée)
  - Clock (timer)
  - Frog (tâche difficile)
  - Flame (créneau secours)
  - Settings (settings)
  - MessageCircle (chatbot)

**Outils :**

- Figma (design tokens)
- Tailwind config (tailwind.config.ts)

---

## Critères de Succès

- [ ] PRD validé par Cédric (Go décision)
- [ ] Wireframes low-fi créés (6 écrans minimum)
- [ ] User flows documentés (5 flows)
- [ ] Design system défini (couleurs, typo, composants)
- [ ] Repo GitHub créé
- [ ] Prêt pour Phase 2 (Setup Technique)

---

## Risques

**Risque 1 : Design trop complexe**

- **Impact :** Retard planning
- **Mitigation :** Low-fidelity only, pas de high-fidelity

**Risque 2 : Cédric veut ajouter des features**

- **Impact :** Scope creep
- **Mitigation :** Rappeler MVP strict, noter features pour V2

---

## Notes

- Garder les wireframes simples (noir & blanc)
- Focus sur les flows, pas sur l'esthétique
- Valider avec Cédric à chaque étape

---

**Prochaine phase :** Phase 2 - Setup Technique
