# AGENTS.md

These instructions apply to the `apps/frontend` project.

## Commit Message Rule

- Always use a conventional, structured commit message.
- Required format: `type(scope): commit message`
- If additional context is useful, write it in the commit body below the subject line.
- Use lowercase `type` values such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`, `perf`, or `revert`.
- Keep the summary concise and action-oriented.

Examples:

- `feat(issue): add realtime presence for issue detail`
- `fix(comment): handle empty discussion state correctly`
- `refactor(auth): simplify session refresh flow`

## Local Port Rule

- Do not run test processes, preview servers, or temporary frontend dev servers on port `3000`.
- Treat port `3000` as reserved for the user's own workflow.
- When a port must be specified for testing or local verification, use a different port such as `3010` or another free port.

## Issue Detail Layout Guardrail

- Do not change the current Issue detail layout in [src/components/shared/issue/NormalIssueDetail.tsx](/Users/luke/Synaply/apps/frontend/src/components/shared/issue/NormalIssueDetail.tsx), [src/components/issue/WorkflowIssueDetail.tsx](/Users/luke/Synaply/apps/frontend/src/components/issue/WorkflowIssueDetail.tsx), or their page entry points unless the user explicitly asks for a layout change.
- Keep Issue detail rendered as the existing page-style detail view, not a `Dialog`/modal overlay.
- Do not casually rearrange the current two-column structure, panel proportions, header placement, or discussion panel behavior for Issue detail pages.

## AI Runtime Hard Constraints

- Next runtime 不得直接读写 Prisma / Supabase 表。
- Next runtime 不得在本地复刻业务校验逻辑（例如 issue 状态机、workflow 转移规则）。所有业务判断必须通过 Nest HTTP 接口完成。
- Next runtime 里的 tool 实现必须是"调用一个 Nest 接口、把结果原样塞回 model"的薄层包装，禁止本地 if/else 业务分支。
- Next runtime 唯一允许写入的本地存储只有：LLM provider 的临时 streaming 状态、AI SDK 的 message buffer。其他状态必须落到 Nest 持久化。
