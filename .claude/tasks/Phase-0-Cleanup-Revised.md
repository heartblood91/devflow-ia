# Phase 0 : Cleanup Boilerplate (Adapté DevFlow)

**Durée :** 2h max
**Statut :** 🟡 À faire
**Priorité :** CRITIQUE (avant toute feature)

---

## Objectif

Nettoyer la boilerplate NOW.TS pour transformer en DevFlow MVP :
- ❌ Supprimer tout le marketing/landing inutile
- ❌ Supprimer Stripe/Billing (Phase 9 plus tard)
- ❌ Supprimer blog/changelog public
- ✅ Garder : Better Auth, Vitest, Docs, Admin, Contact, Feedback
- ✅ Sécuriser : Accès app principal = connexion requise

---

## Audit Résumé

| Élément | Status | Action |
|---------|--------|--------|
| Landing page massive (270 lignes) | ❌ | Supprimer |
| Blog/Posts system | ❌ | Supprimer |
| Changelog public | ❌ | Supprimer |
| Pricing/Plans | ❌ | Supprimer |
| Stripe/Billing | ❌ | Supprimer (MVP) |
| About page | ❌ | Supprimer |
| Contact/Feedback | ✅ | **GARDER** |
| Docs system | ✅ | **GARDER** |
| Admin panel | ✅ | **GARDER** |
| Better Auth | ✅ | **GARDER** |
| Vitest + Playwright | ✅ | **GARDER** |

**Estimation cleanup :** ~95 fichiers, ~5000 lignes → 2h max

---

## Tasks

### 1. Supprimer Pages Marketing (30min)

#### 1.1 Landing Pages

```bash
# Supprimer landing page actuelle
rm app/page.tsx
rm -rf app/home/

# Supprimer about
rm -rf app/(layout)/about/
```

#### 1.2 Blog/Posts System

```bash
rm -rf app/(layout)/posts/
rm -rf src/features/posts/
rm -rf content/posts/ # Si existe
```

#### 1.3 Changelog Public

```bash
rm -rf app/(layout)/changelog/
rm -rf src/features/changelog/
rm -rf content/changelog/ # Si existe
```

#### 1.4 Features Landing

```bash
rm -rf src/features/landing/
rm -rf src/features/plans/
rm -rf src/features/nowts/ # Spécifique NOW.TS (testimonials?)
```

---

### 2. Supprimer Stripe/Billing (20min)

#### 2.1 Pages & Routes

```bash
# Pages billing
rm -rf app/(logged-in)/(account-layout)/account/billing/

# Payment pages
rm -rf app/(layout)/payment/

# Webhooks
rm -rf app/api/webhooks/stripe/
```

#### 2.2 Features & Lib

```bash
# Features
rm -rf src/features/plans/
rm src/features/global-dialog/user-plan-dialog.tsx

# Lib
rm src/lib/stripe.ts
rm -rf src/lib/auth/stripe/
rm src/lib/user/get-user-subscription.ts
```

---

### 3. Cleanup Prisma Schema (15min)

#### 3.1 Retirer Subscription Model

**Fichier :** `prisma/schema/better-auth.prisma`

```prisma
# ❌ SUPPRIMER tout le model Subscription
model Subscription {
  id                   String  @id
  plan                 String
  referenceId          String  @unique
  user                 User    @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  status               String?
  periodStart          DateTime?
  periodEnd            DateTime?
  cancelAtPeriodEnd    Boolean?

  @@map("subscription")
}
```

#### 3.2 Nettoyer User Model

**Fichier :** `prisma/schema/better-auth.prisma`

```diff
model User {
  id              String   @id
  name            String
  email           String
  emailVerified   Boolean
  image           String?
  createdAt       DateTime
  updatedAt       DateTime
  resendContactId String?

  // Outgoing
  sessions      Session[]
  accounts      Account[]
  feedbacks     Feedback[]
- subscription  Subscription?

- // Stripe integration
- stripeCustomerId String?

  role       String?
  banned     Boolean?
  banReason  String?
  banExpires DateTime?

  @@unique([email])
  @@map("user")
}
```

#### 3.3 Garder Feedback Model

**Fichier :** `prisma/schema/schema.prisma`

```prisma
# ✅ GARDER (utile pour contact/support)
model Feedback {
  id      String  @id @default(nanoid(11))
  review  Int
  message String
  email   String?
  userId  String?
  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 3.4 Migration

```bash
# Reset DB si nécessaire
npx prisma migrate reset --force

# Créer nouvelle migration
npx prisma migrate dev --name cleanup-stripe-subscription

# Générer client
npx prisma generate
```

---

### 4. Cleanup Dependencies npm (15min)

#### 4.1 Retirer Packages Inutiles

```bash
pnpm remove stripe
pnpm remove recharts # Si pas utilisé ailleurs
pnpm remove markdown-to-jsx # Si blog supprimé
pnpm remove next-mdx-remote-client # Si blog supprimé
pnpm remove remark-gfm # Si blog supprimé
pnpm remove rehype-autolink-headings # Si blog supprimé
pnpm remove rehype-slug # Si blog supprimé
pnpm remove front-matter # Si changelog/blog supprimé
```

⚠️ **ATTENTION** : Vérifier avant de supprimer :
- `@shikijs/rehype` → Utilisé par docs (code highlighting)
- `markdown-to-jsx` → Utilisé par docs
- Si docs utilise markdown, GARDER ces packages

#### 4.2 Vérifier Usage

```bash
# Vérifier si recharts utilisé ailleurs
grep -r "recharts" src/

# Vérifier markdown libs
grep -r "markdown-to-jsx\|next-mdx-remote" src/
```

---

### 5. Update Configs (15min)

#### 5.1 Site Config

**Fichier :** `src/site-config.ts`

```typescript
export const SiteConfig = {
  title: "DevFlow",
  description: "Productivity system for developers - Time-blocking, AI insights, War Room",
  prodUrl: "https://devflow.app", // TODO: Update domain
  appId: "devflow",
  domain: "devflow.app", // TODO: Update domain
  appIcon: "/images/icon.png",
  company: {
    name: "DevFlow",
    address: "France", // Update if needed
  },
  brand: {
    primary: "#007291", // TODO: DevFlow brand color
  },
  team: {
    image: "https://...", // TODO: Your profile
    website: "https://...", // TODO: Your website
    twitter: "https://...", // TODO: Your twitter
    name: "Cédric", // TODO: Your name
  },
  features: {
    enableImageUpload: false as boolean,
    /**
     * DevFlow : L'app principale nécessite une connexion
     * Si user non connecté → redirige vers /auth/signin
     * Pas de landing page publique
     */
    enableLandingRedirection: false as boolean,
  },
};
```

#### 5.2 Middleware (Sécurité)

**Fichier :** `src/lib/middleware-utils.ts`

Vérifier que l'accès `/app` nécessite une connexion (déjà en place) :

```typescript
export const isAppRoute = (pathname: string) => {
  return pathname.startsWith("/app/app"); // ✅ Déjà protégé
};
```

#### 5.3 Root Redirect

**Fichier :** `src/lib/middleware-utils.ts`

```typescript
export const handleRootRedirect = (request: NextRequest) => {
  // DevFlow : Si connecté → /app, sinon → /auth/signin
  const session = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  const url = request.nextUrl.clone();

  if (session) {
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  // Non connecté → signin
  url.pathname = "/auth/signin";
  return NextResponse.redirect(url);
};
```

#### 5.4 Créer Simple Landing (Optionnel)

Si besoin d'une landing page minimale :

**Fichier :** `app/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { getUser } from "@/lib/user/get-user";

export default async function RootPage() {
  const user = await getUser();

  if (user) {
    redirect("/app");
  }

  redirect("/auth/signin");
}
```

Ou créer une vraie landing simple (à décider).

---

### 6. Cleanup Features (20min)

#### 6.1 Supprimer Features Inutiles

```bash
# Déjà fait dans Task 1
rm -rf src/features/landing/
rm -rf src/features/posts/
rm -rf src/features/changelog/
rm -rf src/features/plans/
rm -rf src/features/nowts/
```

#### 6.2 Cleanup Images

```bash
# Vérifier public/images et supprimer assets landing
ls -la public/images/
# Supprimer placeholder*.gif, testimonials, etc.
rm public/images/placeholder*.gif # Si existent
```

#### 6.3 Cleanup Navigation

**Fichier :** `src/features/navigation/*`

Vérifier et retirer les liens vers :
- `/posts`
- `/changelog`
- `/pricing`
- `/about`

Garder uniquement :
- `/app` (protected)
- `/docs` (public)
- `/contact` (public)
- `/admin` (protected, admin only)

---

### 7. Structure Finale Vérification (10min)

#### 7.1 Structure App Finale

```
app/
├── page.tsx                    # ✅ Redirect: user ? /app : /signin
├── (logged-in)/
│   └── account/
│       └── (settings)/         # ✅ User settings
├── app/                        # ✅ Main app (PROTECTED)
│   ├── page.tsx
│   └── ...
├── admin/                      # ✅ Admin panel (PROTECTED + ROLE)
│   └── ...
├── auth/                       # ✅ Auth pages (public)
│   ├── signin/
│   ├── signup/
│   └── ...
├── docs/                       # ✅ Documentation (public)
│   └── ...
├── (layout)/
│   ├── contact/                # ✅ Contact form (public)
│   └── legal/                  # ✅ Terms/Privacy (public)
└── api/
    └── ...
```

#### 7.2 Features Finales

```
src/features/
├── auth/              # ✅ Authentication
├── contact/           # ✅ Contact/Feedback
├── debug/             # ✅ Debug tools
├── dialog-manager/    # ✅ Global dialogs
├── email/             # ✅ Email system
├── form/              # ✅ Forms
├── global-dialog/     # ✅ Dialogs (retirer user-plan-dialog.tsx)
├── layout/            # ✅ Layout components
├── legal/             # ✅ Legal pages
├── markdown/          # ✅ Markdown (docs)
├── navigation/        # ✅ Navigation
├── page/              # ✅ Page components
├── sidebar/           # ✅ Sidebar
└── theme/             # ✅ Theme switcher
```

---

### 8. Tests & Validation (10min)

#### 8.1 Smoke Tests

```bash
# Install deps
pnpm install

# Type check
pnpm ts

# Lint
pnpm lint

# Tests
pnpm test

# Dev server
pnpm dev
```

#### 8.2 Vérifications Manuelles

- [ ] `http://localhost:3000/` → Redirige vers `/auth/signin` (si non connecté)
- [ ] `http://localhost:3000/` → Redirige vers `/app` (si connecté)
- [ ] `http://localhost:3000/app` → Accessible seulement si connecté
- [ ] `http://localhost:3000/admin` → Accessible seulement si admin
- [ ] `http://localhost:3000/docs` → Accessible sans connexion
- [ ] `http://localhost:3000/contact` → Accessible sans connexion
- [ ] Aucune erreur console
- [ ] Aucune 404 sur navigation

---

### 9. Git Cleanup (10min)

#### 9.1 Commit Cleanup

```bash
git add .
git commit -m "chore: cleanup boilerplate for DevFlow MVP

- Remove landing pages, marketing features (landing, reviews, CTA)
- Remove blog/posts system
- Remove public changelog
- Remove Stripe/billing (MVP - Phase 9 later)
- Remove pricing/plans features
- Cleanup Prisma schema (Subscription model, stripe fields)
- Update site-config.ts (DevFlow branding)
- Remove unused npm dependencies (stripe, recharts, markdown libs)
- Keep: Better Auth, Vitest, Docs, Admin, Contact, Feedback
- Security: App access requires authentication

🤖 Generated with Claude Code via Happy
Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Critères de Succès

- [ ] Landing/marketing pages supprimées (~50 files)
- [ ] Stripe/billing supprimé (~15 files)
- [ ] Blog/changelog supprimé (~20 files)
- [ ] Prisma schema nettoyé (Subscription removed)
- [ ] Dependencies npm nettoyées
- [ ] site-config.ts mis à jour (DevFlow)
- [ ] `/` redirige vers `/app` (connecté) ou `/signin` (non connecté)
- [ ] `/app` accessible seulement si connecté
- [ ] `/docs`, `/contact` accessibles sans connexion
- [ ] Docs system fonctionnel
- [ ] Admin panel fonctionnel
- [ ] Contact/Feedback fonctionnel
- [ ] `pnpm dev` fonctionne sans erreur
- [ ] `pnpm test` passe
- [ ] `pnpm ts` OK
- [ ] `pnpm lint` OK
- [ ] Aucune 404 en navigation

---

## Structure Finale DevFlow

```
devflow-ia/
├── app/
│   ├── page.tsx              # Redirect smart
│   ├── (logged-in)/account/  # User settings
│   ├── app/                  # 🔒 Main app (PROTECTED)
│   ├── admin/                # 🔒 Admin (PROTECTED + ROLE)
│   ├── auth/                 # 🌐 Auth pages
│   ├── docs/                 # 📚 Documentation (public)
│   ├── (layout)/
│   │   ├── contact/          # 📧 Contact (public)
│   │   └── legal/            # ⚖️ Legal (public)
│   └── api/
├── src/
│   ├── components/ui/        # shadcn/ui
│   ├── features/             # Features (cleaned)
│   ├── lib/                  # Utils
│   └── hooks/
├── prisma/
│   └── schema/
│       ├── schema.prisma     # Feedback only
│       └── better-auth.prisma # User, Session, Account (no Subscription)
└── package.json              # Cleaned dependencies
```

---

## Prochaine Phase

**Phase 1 : Design & Wireframes DevFlow**
- Wireframes principales vues
- Design system brutal (colors, typography)
- User flows (onboarding, planning, execution)

---

## Notes

- ✅ Pas de monorepo (Next.js monolith)
- ✅ Pas de Jest (Vitest déjà configuré)
- ✅ Pas de NextAuth (Better Auth déjà configuré)
- ✅ CLI sera ajouté en Phase 7 (simple package dans `/cli`)
- ✅ Clean Architecture simplifiée (pas de packages/core séparé)
- ⚠️ Vérifier usage markdown libs avant suppression (docs system)
- ⚠️ Stripe sera réintroduit en Phase 9 (billing simple)
