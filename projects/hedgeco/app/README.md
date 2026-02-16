# HedgeCo.Net v2

Modern rebuild of HedgeCo.Net — the premier alternative investment network connecting hedge funds, investors, and service providers.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Prisma ORM, PostgreSQL
- **AI:** OpenAI (GPT-4o, embeddings), pgvector
- **Testing:** Vitest, Playwright
- **Tooling:** ESLint, Prettier, Husky

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (with pgvector extension for AI features)
- npm or pnpm

## Getting Started

### 1. Install Dependencies

```bash
cd projects/hedgeco/app
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hedgeco?schema=public"

# Auth (generate secrets with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and re-seed |

## Demo Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hedgeco.net | password123 |
| Manager | john.smith@alphacapital.com | password123 |
| Investor | investor@example.com | password123 |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Landing page
│   ├── login/            # Login page
│   ├── register/         # Registration (4 user types)
│   └── funds/            # Fund directory
│       ├── page.tsx      # Fund listing
│       └── [slug]/       # Fund detail page
├── components/
│   ├── layout/           # Header, Footer
│   └── ui/               # shadcn/ui components
└── lib/
    ├── prisma.ts         # Prisma client singleton
    └── utils.ts          # Utility functions

prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Seed data script
```

## Key Features

### For Investors
- Browse 2,500+ funds with advanced filtering
- AI-powered natural language search
- Detailed performance analytics
- Direct manager connections
- Watchlist management

### For Fund Managers
- Free fund listing
- Performance tracking
- PDF report generation
- Investor inquiries

### For Service Providers
- Directory listing
- Premium placement options
- Lead generation

## Architecture

See `/projects/hedgeco/ARCHITECTURE.md` for full system design.

## Contributing

1. Create a feature branch
2. Make changes with proper TypeScript types
3. Run `npm run lint` before committing
4. Submit PR with clear description

## License

Proprietary — HedgeCo.Net © 2026
