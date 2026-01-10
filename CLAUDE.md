# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About the project DevFlow

DevFlow is a productivity system designed for 10x developers. It aggregates scientifically validated productivity concepts into a single application:

- **Time-blocking with chronotype optimization** - Schedule deep work during your biological peak hours
- **Weekly War Room** - Sunday planning ritual to set objectives and allocate time
- **Daily Reflection with AI insights** - Evening review with AI-generated suggestions
- **Focus Timer** - Pomodoro (25/5) or Ultradian (90/20) rhythms
- **DevFlow AI** - Proactive chatbot assistant that learns your patterns
- **DevFlow CLI** - Rapid task import from terminal

**Goal:** Help developers achieve sustainable high productivity without burnout by combining proven productivity techniques with AI insights.

## Development Commands

### Core Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application
- `pnpm start` - Start production server
- `pnpm ts` - Run TypeScript type checking
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm lint:ci` - Run ESLint without auto-fix for CI
- `pnpm clean` - Run lint, type check, and format code
- `pnpm format` - Format code with Prettier

### Testing Commands

- `pnpm test:ci` - Run unit tests in CI mode
- `pnpm test:e2e:ci` - Run e2e tests in CI mode (headless)

### Database Commands

- `pnpm prisma:seed` - Seed the database
- `pnpm better-auth:migrate` - Generate better-auth Prisma schema

### Development Tools

- `pnpm email` - Email development server
- `pnpm knip` - Run knip for unused code detection

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (no organizations for MVP)
- **Email**: React Email with Resend
- **AI**: Vercel AI SDK with OpenAI
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Package Manager**: pnpm

### Project Structure

- `app/` - Next.js App Router pages and layouts
- `src/components/` - UI components (Shadcn/UI in `ui/`, custom in `nowts/`)
  - `src/components/dashboard/` - Dashboard components
  - `src/components/backlog/` - Backlog/Kanban components
  - `src/components/weekly/` - Weekly planning components
  - `src/components/timer/` - Focus timer components
  - `src/components/chatbot/` - DevFlow AI chatbot components
- `src/lib/` - Utilities, configurations, and services
  - `src/lib/actions/` - Server Actions (business logic)
  - `src/lib/ai/` - DevFlow AI context and prompts
  - `src/lib/stats/` - Statistics calculations for insights
- `src/hooks/` - Custom React hooks
- `cli/` - DevFlow CLI (separate npm package)
- `emails/` - Email templates using React Email
- `prisma/` - Database schema and migrations
- `e2e/` - End-to-end tests
- `__tests__/` - Unit tests

### Key Features

- **Authentication**: Email/password, OAuth (GitHub, Google) - Better Auth
- **Task Management**: Backlog, prioritization, time-blocking
- **Weekly Planning**: War Room interface for setting objectives
- **Focus Timer**: Pomodoro/Ultradian timer with focus mode
- **AI Insights**: Daily reflections with AI-powered suggestions
- **DevFlow CLI**: Command-line interface for rapid task capture
- **Dialog System**: Global dialog manager for modals and confirmations
- **Forms**: React Hook Form with Zod validation and server actions
- **Email System**: Transactional emails with React Email

## Code Conventions

### TypeScript

- Use `type` over `interface` (enforced by ESLint)
- Prefer functional components with TypeScript types
- No enums - use maps instead
- Strict TypeScript configuration

### React/Next.js

- Prefer React Server Components over client components
- Use `"use client"` only for Web API access in small components
- Wrap client components in `Suspense` with fallback
- Use dynamic loading for non-critical components

### Styling

- Mobile-first approach with TailwindCSS
- Use Shadcn/UI components from `src/components/ui/`
- Custom components in `src/components/nowts/`

### Styling preferences

- Use the shared typography components in `@src/components/ui/typography.tsx` for paragraphs and headings (instead of creating custom `p`, `h1`, `h2`, etc.).
- For spacing, prefer utility layouts like `flex flex-col gap-4` for vertical spacing and `flex gap-4` for horizontal spacing (instead of `space-y-4`).
- Prefer the card container `@src/components/ui/card.tsx` for styled wrappers rather than adding custom styles directly to `<div>` elements.

### State Management

- Use `nuqs` for URL search parameter state
- Zustand for global state (see dialog-store.ts)
- TanStack Query for server state

### Forms and Server Actions

- Use React Hook Form with Zod validation
- Server actions in `.action.ts` files
- Use `resolveActionResult` helper for mutations
- Follow form creation pattern in `/src/features/form/`

### Authentication

- Use `getUser()` for optional user (server-side)
- Use `getRequiredUser()` for required user (server-side)
- Use `useSession()` from auth-client.ts (client-side)
- **Note:** No organization/multi-tenant features in MVP

### Database

- Prisma ORM with PostgreSQL
- Database hooks for user creation setup
- User-based data access patterns (no organizations)

### Dialog System

- Use `dialogManager` for global modals
- Types: confirm, input, custom dialogs
- Automatic loading states and error handling

## Testing

### Unit Tests

- Located in `__tests__/` directory
- Use Vitest with React Testing Library
- Mock extended with `vitest-mock-extended`

### E2E Tests

- Located in `e2e/` directory
- Use Playwright with custom test utilities
- Helper functions in `e2e/utils/`

## Important Files

- `src/lib/auth.ts` - Authentication configuration
- `src/features/dialog-manager/` - Global dialog system
- `src/lib/actions/actions-utils.ts` - Server action utilities
- `src/components/ui/form.tsx` - Form components
- `prisma/schema.prisma` - Database schema
- `src/site-config.ts` - Site configuration
- `src/lib/actions/safe-actions.ts` - All Server Action SHOULD use this logic
- `src/lib/zod-route.ts` - All Next.js route (inside the folder `/app/api` and name `route.ts`) SHOULD use this logic

## Development Notes

- Always use `pnpm` for package management
- Use TypeScript strict mode - no `any` types
- Prefer server components and avoid unnecessary client-side state
- Prefer using `??` than `||`
- All API Route SHOULD use @src/lib/zod-route.ts, each file name `route.ts` should use Zod Route. ALWAYS READ zod-route.ts before creating any routes.
- All API Request SHOULD use @src/lib/up-fetch.ts and NEVER use `fetch`

## Files naming

- All server actions should be suffix by `.action.ts` eg. `user.action.ts`, `dashboard.action.ts`

## Git Commit Conventions

### Format: Conventional Commits

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>
```

**Allowed types:**
- `feat` - New feature for the user
- `fix` - Bug fix for the user
- `chore` - Maintenance, configuration, dependencies
- `docs` - Documentation changes
- `refactor` - Code refactoring (no functional change)
- `test` - Adding or updating tests
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `perf` - Performance improvements

**Examples of good commits:**

```bash
feat(backlog): add drag-and-drop for task prioritization

Implement drag-and-drop using @dnd-kit/core to allow users to reorder tasks
in the backlog by priority. Tasks are automatically saved to the database
on drop.

feat(timer): add Pomodoro timer with notifications

fix(auth): prevent session expiration during active work

chore(deps): update Next.js to 15.1.0

refactor(dashboard): extract TaskCard component for reusability

test(backlog): add unit tests for task prioritization logic

docs(readme): update setup instructions for DevFlow
```

**Examples of bad commits:**

```bash
# ❌ Too vague
update stuff

# ❌ No type
added new feature for tasks

# ❌ Too long subject (> 72 chars)
feat(backlog): add drag-and-drop functionality for task prioritization in the backlog with automatic saving

# ❌ Multiple concerns
feat(auth): add login page and fix timer bug
```

### Commit Rules

1. **NO commits without review** - You MUST wait for user approval before committing
2. **Atomic commits** - One logical change per commit
3. **Subject line** - Max 72 characters, imperative mood ("add" not "added")
4. **Body** - Explain WHAT and WHY, not HOW (code explains HOW)
5. **Breaking changes** - Must include `BREAKING CHANGE:` in the footer

### No Git Hooks (Husky)

We do NOT use Husky or pre-commit hooks. Quality is the developer's responsibility:

- Run `pnpm lint` before committing
- Run `pnpm test:ci` before committing
- Run `pnpm ts` before committing
- Use `pnpm clean` to run all checks at once

**Philosophy:** We trust developers to maintain quality rather than enforce it through automation. This encourages mindfulness and ownership.

## Debugging and complexe tasks

- For complexe logic and debugging, use logs. Add a lot of logs at each steps and ASK ME TO SEND YOU the logs so you can debugs easily.

## TypeScript imports

Important, when you import thing try to always use TypeScript paths :

- `@/*` is link to @src
- `@email/*` is link to @emails
- `@app/*` is link to @app

## Workflow modification

🚨 **CRITICAL RULE - ALWAYS FOLLOW THIS** 🚨

**BEFORE editing any files, you MUST Read at least 3 files** that will help you to understand how to make a coherent and consistency.

This is **NON-NEGOTIABLE**. Do not skip this step under any circumstances. Reading existing files ensures:

- Code consistency with project patterns
- Proper understanding of conventions
- Following established architecture
- Avoiding breaking changes

**Types of files you MUST read:**

1. **Similar files**: Read files that do similar functionality to understand patterns and conventions
2. **Imported dependencies**: Read the definition/implementation of any imports you're not 100% sure how to use correctly - understand their API, types, and usage patterns

**Steps to follow:**

1. Read at least 3 relevant existing files (similar functionality + imported dependencies)
2. Understand the patterns, conventions, and API usage
3. Only then proceed with creating/editing files
