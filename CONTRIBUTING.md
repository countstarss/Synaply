# Contributing to Synaply

Thanks for your interest in contributing to Synaply.

Synaply is remote collaboration software for small startup teams. The project is intentionally opinionated. We welcome contributions that improve the core collaboration loop, but we do not want to turn the product into a generic management suite.

## Before You Start

Please read these project-level documents first:

- [`README.md`](./README.md)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- [`AGENTS.md`](./AGENTS.md)

## Product Direction

Changes are most likely to be accepted when they do at least one of the following:

- clarify cross-role handoff
- reduce coordination friction in remote work
- strengthen the `Project -> Issue -> Workflow -> Doc -> Inbox` chain

Changes are less likely to be accepted when they push Synaply toward:

- built-in chat as a primary product surface
- heavy planning tools such as gantt charts, timesheets, or capacity systems
- broad management-suite expansion before the core loop is solid

## Repository Structure

This repository is a single pnpm workspace monorepo:

- `apps/frontend` contains the Next.js frontend
- `apps/backend` contains the NestJS backend
- `supabase` contains local Supabase config, migrations, and seed data

Most application code changes belong in one of the workspaces. Root-level changes usually affect documentation, repository metadata, shared tooling, or shared project guidance.

## Contribution Workflow

For most code contributions, use this flow:

1. Make the actual code change in the correct workspace:
   - `apps/frontend`
   - `apps/backend`
2. Keep related root-level tooling or documentation changes in the same repository change when they are part of the same story.
3. Run installs and common verification from the root workspace when practical.
4. If the change spans frontend and backend, keep it in one focused PR instead of splitting it artificially.

## Where To Open Changes

Use the root repository when the change is primarily about:

- top-level documentation
- licensing
- contribution policy
- security policy
- deployment guidance
- workspace tooling and repository guidance

Use `apps/frontend` when the change is primarily about:

- UI
- routes
- state and client behavior
- docs editing experience
- workflow visualization
- frontend-side AI interfaces

Use `apps/backend` when the change is primarily about:

- domain logic
- authentication and authorization
- API behavior
- Prisma and database access
- backend-side AI execution and thread services

## Development Setup

Use the documented local path:

1. Install dependencies from the repository root with `pnpm install`.
2. Start local Supabase.
3. Configure frontend and backend environment files.
4. Run backend and frontend as separate services.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the current setup guide.

## Contribution Expectations

- Prefer small, focused pull requests.
- Explain the user problem, not only the code change.
- Keep docs in sync when behavior, setup, or contributor expectations change.
- Do not introduce secrets, local `.env` files, or private credentials into commits.
- If your change affects product direction, open an issue or discussion before large implementation work.

## Pull Requests

When opening a PR, include:

- what changed
- why it changed
- how it was verified
- any follow-up work or open questions

If your change touches UX, product structure, or workflows, include screenshots or short videos when possible.

## Code Style

- Follow the existing patterns of the affected workspace.
- Keep changes aligned with the current architecture instead of introducing parallel systems.
- Prefer clarity over abstraction when the product model is still evolving.

## Security

Please do not report security vulnerabilities through public issues.

See [`SECURITY.md`](./SECURITY.md) for reporting guidance.

## Maintainer Review Policy

Maintainer time is limited and review is best-effort.

- Bug fixes, setup improvements, documentation improvements, and focused product-fit changes are the best first contributions.
- Large feature additions may be declined if they do not fit the product guardrails.
- Maintainers may request scope reduction before review.
