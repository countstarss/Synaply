# Synaply Workspace Guide

This file is the root instruction set for the Synaply workspace. It should stay aligned with the current repository layout and cover the guardrails that apply across `apps/frontend` and `apps/backend`.

## Repository Scope

The root workspace currently contains:

- `apps/frontend`: the Next.js frontend application
- `apps/backend`: the NestJS backend application
- shared root-level docs, notes, modules, and setup assets

When a nested project has its own `AGENTS.md`, treat that file as the project-local extension of this root guide. Root rules still apply unless the nested guide is more specific.

## Repository Workflow Rules

- Unless the user explicitly asks to commit the repository, do not stage, commit, or push changes.
- Prefer scoping changes to the relevant workspace paths such as `apps/frontend` or `apps/backend`.
- If the task may require a broad repository-level Git action, pause and confirm before doing it.

## Commit Message Rule

- Always use a conventional, structured commit message.
- Required format: `type(scope): commit message`
- If additional context is useful, write it in the commit body below the subject line.
- Use lowercase `type` values such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`, `perf`, or `revert`.
- Keep the summary concise and action-oriented.

Examples:

- `feat(issue): add realtime presence for issue detail`
- `fix(comment): handle empty discussion state correctly`
- `refactor(prisma): normalize schema field mapping`

## Product Positioning

Synaply is remote collaboration software for small startup teams.

It is designed for 3 to 15 person startup teams with mixed roles such as product, design, engineering, and operations. The product promise is not "manage more tasks", but "help small startup teams collaborate remotely with more speed, less friction, and more clarity".

The core product shape is:

- Projects define scope and direction.
- Issues capture actionable units of work.
- Workflows make progress and handoff visible.
- Docs preserve context, decisions, and shared understanding.
- Inbox and sync surfaces keep the team aligned on what changed and what needs attention.

Synaply should not evolve into a generic project management suite. It should remain a high-end, restrained collaboration product centered on structured execution and momentum.

## Product Decision Filter

Any new feature should be evaluated against these three questions:

1. Does it make cross-role handoff clearer?
2. Does it reduce the need for chasing, meetings, or repeated status checks in remote work?
3. Does it strengthen the integration of Projects, Issues, Workflows, and Docs into one coherent context?

If a feature only satisfies one of the three, it should be treated cautiously.

## Frontend Rules

These rules apply to `apps/frontend`.

### UI and Copy

- Use shadcn/ui primitives for interactive form controls such as filters, selects, dialogs, and buttons. Do not use browser-default `<select>` controls for product filtering UI.
- Sidebar and navigation labels may keep short, obvious English such as `My Work`, `Inbox`, `Docs`, `Issues`, `Projects`, and `Workflows`.
- Product copy, prompts, empty states, validation, and action guidance should be written in Chinese.
- Any newly introduced user-facing hardcoded copy, including button text, hints, validation, toasts, empty states, and error messages, must be internationalized in the same change. Do not leave temporary hardcoded strings as follow-up debt.

### Local Development

- Do not run test processes, preview servers, or temporary frontend dev servers on port `3000`.
- Treat port `3000` as reserved for the user's own workflow.
- When a port must be specified for testing or local verification, use a different port such as `3010` or another free port.

### Issue Detail Layout Guardrail

- Do not change the current Issue detail layout in `src/components/shared/issue/NormalIssueDetail.tsx`, `src/components/issue/WorkflowIssueDetail.tsx`, or their page entry points unless the user explicitly asks for a layout change.
- Keep Issue detail rendered as the existing page-style detail view, not a `Dialog` or modal overlay.
- Do not casually rearrange the current two-column structure, panel proportions, header placement, or discussion panel behavior for Issue detail pages.

### Frontend AI Runtime Hard Constraints

- Next runtime must not directly read or write Prisma or Supabase tables.
- Next runtime must not locally duplicate business validation logic such as issue state machines or workflow transition rules. All business decisions must go through Nest HTTP APIs.
- Tool implementations in Next runtime must be thin wrappers that call one Nest endpoint and pass the result through. Do not add local business branching in the frontend runtime.
- The only local storage writes allowed in Next runtime are temporary LLM streaming state and AI SDK message buffers. Other persistent state must live in Nest-managed storage.

## Backend Rules

These rules apply to `apps/backend`.

### Backend AI Runtime Guardrails

- All `ai-*` module service entry points must call `TeamMemberService.validateWorkspaceAccess` first, before any business logic, so workspace isolation is enforced consistently.
- Cross-module foreign keys must be maintained in SQL migrations, not through Prisma schema relations for reverse links such as Workspace or User. Follow the existing `AiExecutionRecord` and `AiThread*` pattern.
- When adding a new `ai-execution` action, only update `ACTION_DEFINITIONS`. `getActionManifest` must continue deriving the manifest automatically from that definition map instead of keeping a second manual manifest in sync.
- `ai_run_step.promptSnapshot` and `ai_run_step.responseSnapshot` must be truncated to a reasonable size before persistence. Keep each entry within a practical limit, with `8KB` as the default upper bound.

## Necessary Product Features

These are considered essential for the positioning to hold.

### 1. Handoff and Review Mechanism

The product should support explicit handoff between roles, such as:

- request product confirmation
- request design review
- request engineering takeover
- request operations release follow-up

Reason:
Synaply is positioned around multi-role collaboration rather than individual task tracking. Without explicit handoff, workflow becomes cosmetic status management instead of real coordination.

### 2. Blockers and Dependencies

Each issue should be able to show:

- whether it is blocked
- what is blocking it
- who is responsible for unblocking it
- when progress is expected to resume

Reason:
In remote teams, delivery risk often comes from invisible waiting, not from lack of task creation. Blockers must be visible without requiring people to ask around.

### 3. Decision Log

The product should preserve key decisions alongside execution artifacts and link them to relevant projects, issues, and docs.

Reason:
If docs are part of collaboration rather than a final archive, the product must capture not only what was done, but why the team chose a given direction.

### 4. Personal Pulse and Team Pulse

The product should make it obvious:

- what I need to handle now
- where the team is at risk

Reason:
Collaboration software should reduce ambiguity around next steps. The homepage should answer priority and momentum, not just display data.

### 5. Async Digest

Provide a concise daily or weekly summary of:

- project progress
- workflow movement
- open risks
- pending confirmations

Reason:
Remote-first teams need shared rhythm, but that rhythm should come from structured updates rather than notification noise.

### 6. Template System

Provide lightweight templates for recurring collaboration structures, such as:

- project brief
- requirement doc
- design review
- release checklist
- retrospective

Reason:
Small teams need consistency more than configurability. Templates reduce process reinvention and reinforce good operating habits.

### 7. Lightweight Integrations

Prioritize integrations with:

- GitHub for engineering execution
- Slack for notifications and coordination signals

Reason:
These integrations help adoption without turning Synaply into a chat tool or a developer-only tool. They should bridge workflows, not become the center of gravity.

## Good Ideas, But Not First

These directions fit the product, but should come after the core collaboration loop is strong.

### 1. Milestones and Release View

Useful for grouping multiple issues into delivery phases, but secondary to handoff, blockers, and decision clarity.

### 2. Rituals

Examples include weekly planning, async standup, and retrospectives.

These reinforce team rhythm, but only after the base objects and workflow transitions are solid.

### 3. Role-Based Views

Different roles may need different entry points, but the underlying system should remain unified.

This can improve usability, but should not become a heavy permissions or dashboard-composition project too early.

### 4. AI Assist

Useful areas include:

- summarizing project changes
- extracting next actions
- identifying possible risks

AI should amplify clarity, not replace structure. The system architecture must be coherent before AI is layered on top.

## Not Recommended Right Now

These directions are likely to dilute the product.

### 1. Built-In Chat

This would shift the product toward a messaging tool and weaken its focus on structured collaboration.

### 2. Heavy Planning Tools

Avoid complex gantt charts, resource planning, timesheets, and enterprise-style capacity management.

These are better fits for large organizations with heavier process overhead.

### 3. Broad Management Suites

Avoid expanding into full OKR, CRM, or generic knowledge portal territory.

The more surface area Synaply covers, the weaker its core promise becomes.

### 4. Complex Approval Engines

The product should remain lightweight but rigorous, not turn into an enterprise workflow automation system.

## Recommended Product Sequence

The product roadmap should follow this order:

1. Fully connect the core chain of Project -> Issue -> Workflow -> Doc -> Inbox.
2. Build the critical collaboration actions: handoff, blockers, decisions, and digest.
3. Add reinforcement layers such as templates, integrations, AI assist, and role-based views.

In short:

Do not add more modules before making collaboration itself move more naturally.

Synaply should win by making work easier to advance, not by offering the largest number of features.
