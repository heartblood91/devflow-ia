# DevFlow

> Productivity system for 10x developers

## What is DevFlow?

DevFlow is a productivity application that aggregates scientifically validated productivity concepts into a single system designed specifically for developers:

- **Time-blocking with chronotype optimization** - Schedule deep work during your biological peak hours
- **Weekly War Room** - Sunday planning ritual to set clear objectives and allocate time
- **Daily Reflection with AI insights** - Evening review with AI-generated suggestions for improvement
- **Focus Timer** - Pomodoro (25/5) or Ultradian (90/20) rhythm support
- **DevFlow AI** - Proactive chatbot assistant that learns your productivity patterns
- **DevFlow CLI** - Rapid task import directly from your terminal

**Goal:** Help developers achieve sustainable high productivity without burnout by combining proven productivity techniques with AI-powered insights.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Better Auth
- **Styling:** TailwindCSS v4 + Shadcn/UI
- **AI:** Vercel AI SDK with OpenAI
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Package Manager:** pnpm

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Setup database

```bash
# Copy environment template
cp .env-template .env

# Configure DATABASE_URL in .env with your PostgreSQL connection string
# Example: postgresql://user:password@localhost:5432/devflow

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 3. Configure Better Auth

```bash
# Generate auth secret
openssl rand -base64 32

# Add to .env:
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=http://localhost:3000
```

### 4. (Optional) Configure OAuth providers

For GitHub OAuth:

```bash
# Add to .env:
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
```

For Google OAuth:

```bash
# Add to .env:
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### 5. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Core Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
```

### Quality Checks

```bash
pnpm ts           # TypeScript type checking
pnpm lint         # ESLint with auto-fix
pnpm format       # Format code with Prettier
pnpm clean        # Run all checks (lint + ts + format)
```

### Testing

```bash
pnpm test         # Run unit tests (watch mode)
pnpm test:ci      # Run unit tests (CI mode)
pnpm test:e2e:ci  # Run e2e tests (headless)
```

### Database

```bash
npx prisma studio                  # Open Prisma Studio
npx prisma migrate dev             # Create and apply migration
npx prisma generate                # Generate Prisma Client
pnpm better-auth:migrate           # Generate Better Auth schema
```

## Architecture

DevFlow uses a simple Next.js monolith architecture:

```
app/                    # Next.js App Router pages
  ├── (auth)/          # Authentication pages
  ├── dashboard/       # Main dashboard
  ├── backlog/         # Task backlog
  ├── weekly/          # Weekly planning
  └── api/             # API routes

src/
  ├── components/      # React components
  │   ├── ui/          # Shadcn/UI components
  │   ├── dashboard/   # Dashboard components
  │   ├── backlog/     # Backlog components
  │   ├── weekly/      # Weekly planning
  │   ├── timer/       # Focus timer
  │   └── chatbot/     # DevFlow AI chatbot
  │
  └── lib/             # Core logic
      ├── actions/     # Server Actions
      ├── ai/          # DevFlow AI
      └── stats/       # Statistics calculations

cli/                   # DevFlow CLI (separate package)
prisma/               # Database schema
```

## DevFlow CLI

The DevFlow CLI allows rapid task capture from the terminal:

```bash
cd cli
pnpm install
pnpm build

# Use locally
devflow add "Implement auth flow"
devflow start
devflow status
```

See [cli/README.md](cli/README.md) for more details.

## Contributing

DevFlow is currently in MVP development. Contributions will be welcome once the core features are stable.

## License

MIT

---

Built with ❤️ for developers who want to achieve more without burning out.
