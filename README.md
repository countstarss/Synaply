<p align="center">
  <img src="./public/synaply-logo.png" alt="Synaply logo" width="120" />
</p>

<h1 align="center">Synaply</h1>

<p align="center">
  Remote collaboration software for small startup teams.
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="./readme/README.zh-CN.md">简体中文</a> ·
  <a href="./readme/README.ko.md">한국어</a> ·
  <a href="./readme/README.ja.md">日本語</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-active%20development-0a7ea4">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-Next.js%2015-111111?logo=nextdotjs">
  <img alt="Backend" src="https://img.shields.io/badge/backend-NestJS%2010-e0234e?logo=nestjs">
  <img alt="Database" src="https://img.shields.io/badge/database-PostgreSQL%20%2B%20Supabase-3ecf8e?logo=supabase">
  <img alt="ORM" src="https://img.shields.io/badge/ORM-Prisma-2d3748?logo=prisma">
  <img alt="API" src="https://img.shields.io/badge/API-REST%20%2B%20Swagger-f26b00">
  <img alt="License" src="https://img.shields.io/badge/license-ELv2-0a7ea4">
</p>

## Overview

<p align="center">
  <img alt="Synaply product preview" src="./public/synaply-1.png" />
</p>

Synaply is remote collaboration software for small startup teams that need faster remote collaboration, clear execution, visible handoff, and shared context across projects, issues, workflows, docs, and inbox updates.

It is intentionally not positioned as a generic project management suite. The product is designed around one core promise: help teams move work to delivery with less friction, fewer status pings, and clearer ownership.

## Why Synaply

Remote teams usually do not fail because they cannot create enough tasks. They fail because handoff is fuzzy, blockers stay invisible, context gets buried, and nobody has a clean view of what needs attention now.

Synaply is built to make these moments explicit:

- Project scope and direction
- Actionable issues
- Workflow progress and handoff
- Decision context in docs
- Inbox-style updates and async visibility

## Core Model

The core chain in Synaply is:

`Project -> Issue -> Workflow -> Doc -> Inbox`

That chain is the product center of gravity. New features should strengthen it instead of pulling the product toward chat, heavy planning, or enterprise workflow automation.

## What Synaply Includes

- Project and workspace structure for focused team execution
- Issue management with assignees, priorities, and workflow state
- Workflow editing and visual step orchestration
- Docs tied to execution artifacts instead of living in a separate silo
- Inbox and activity surfaces for async coordination
- AI execution and AI thread modules for assisted workflows
- Team, comment, calendar, and task modules around the collaboration loop
- Internationalized frontend routes and localized product surfaces

## Architecture

Synaply is organized as a single-repository pnpm workspace monorepo:

- [`apps/frontend`](./apps/frontend): Next.js application
- [`apps/backend`](./apps/backend): NestJS API service
- [`supabase`](./supabase): local Supabase config, migrations, and seed data

At a high level:

- Frontend handles product UI, client-side state, docs editing, workflow visualization, and localized routes.
- Backend provides domain APIs for projects, issues, workflows, docs, inbox, auth, AI execution, and more.
- Supabase provides auth and PostgreSQL-backed local development infrastructure.

## Tech Stack

### Product and Platform

- Frontend: Next.js 15, React 19, TypeScript
- Backend: NestJS 10, REST APIs, Swagger
- Database: PostgreSQL
- Auth and local infra: Supabase
- ORM: Prisma 7

### UI and Client Experience

- Tailwind CSS 4
- Radix UI primitives
- shadcn/ui-style component architecture
- Framer Motion
- Sonner
- next-intl

### Collaboration and Editing

- BlockNote for rich docs editing
- React Flow for workflow visualization
- Yjs, `y-websocket`, and `y-indexeddb` for collaborative and local-first editing support
- `@dnd-kit/react` for interaction patterns

### AI and Data Layer

- Custom Anthropic-compatible AI runtime
- TanStack Query
- Zustand
- Dexie

## Notable Open-Source Libraries

If you want a quick view of the main open-source pieces used here, these are the ones most visible in the codebase:

- `next`, `react`, `typescript`
- `@nestjs/*`
- `@prisma/client`, `prisma`
- `@supabase/supabase-js`, `@supabase/ssr`
- `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`
- `reactflow`
- `next-intl`
- `framer-motion`
- `@tanstack/react-query`
- `zustand`, `dexie`
- `@radix-ui/react-*`

## Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm
- Supabase CLI

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Synaply
```

### 2. Start the local Supabase stack

From the repository root:

```bash
supabase start
```

This project already includes local Supabase config under [`supabase`](./supabase), including migrations and seed data.

### 3. Configure environment variables

Backend:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Frontend:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

Important values:

- Backend uses `PORT`, `CORS_ORIGINS`, `DATABASE_URL`, `SUPABASE_URL`, `JWT_SECRET`
- Frontend uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`
- AI-related frontend server envs support `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`, or `ANTHROPIC_API_KEY`

### 4. Install dependencies

Install all workspace dependencies once from the repository root:

```bash
pnpm install
```

### 5. Run the services

Backend, in one terminal:

```bash
pnpm dev:backend
```

Frontend, in another terminal:

```bash
pnpm dev:frontend
```

If you need a non-default frontend port for local verification, run:

```bash
pnpm dev:frontend:3010
```

### 6. Open the local apps

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend health: [http://localhost:5678/health](http://localhost:5678/health)
- Backend Swagger: [http://localhost:5678/api](http://localhost:5678/api)
- Supabase Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)

## Repository Structure

```text
Synaply/
├── supabase/             # Local Supabase config, migrations, and seed data
├── apps/                 # Application workspaces
│   ├── backend/          # NestJS backend service
│   └── frontend/         # Next.js frontend application
├── DEPLOYMENT.md         # Deployment notes
├── AGENTS.md             # Product and agent instructions
└── notes/                # Product and planning notes
```

## API and Developer Entry Points

- REST health check: `GET /health`
- Swagger docs: `/api`
- Frontend internationalized app routes live under [`apps/frontend/src/app/[locale]`](./apps/frontend/src/app/%5Blocale%5D)

## Deployment

For detailed deployment and local run instructions, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

If you are preparing Synaply for a public GitHub release, also review [`OPEN_SOURCE_READINESS.md`](./OPEN_SOURCE_READINESS.md).

## Project Status

Synaply is in active development. The current repository already contains the main product building blocks, but the README should be read as a map of the product rather than a claim that every workflow is finalized.

The highest-priority product direction remains:

- strengthen the `Project -> Issue -> Workflow -> Doc -> Inbox` chain
- make handoff and blockers explicit
- improve async team visibility without turning the product into a chat-first tool

## Contributing

Contributions, issues, and focused product feedback are welcome.

For contributor workflow and expectations, see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

Synaply now uses a single-repository monorepo layout, so cross-workspace changes can be developed and reviewed together when needed.

If you plan to contribute:

- keep changes aligned with the product positioning above
- prefer improvements that clarify handoff, reduce coordination friction, or strengthen shared context
- avoid expanding Synaply into a broad management suite without first improving the core collaboration loop

## License

Synaply is distributed under the [`Elastic License 2.0`](./LICENSE).

That means the repository is publicly available and source-available, but it should not be described as an OSI-approved open-source project.

Internal use, modification, and redistribution are allowed under ELv2. Offering Synaply itself as a hosted or managed service requires rights beyond ELv2 and is intended to be handled separately through commercial licensing.

For security reporting guidance, see [`SECURITY.md`](./SECURITY.md).
