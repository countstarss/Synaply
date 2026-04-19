# Open-Source Readiness

This document tracks the remaining work needed before Synaply is ready to be published as a public GitHub repository under a source-available license.

It is based on the current repository state and the launch issues:

- `SYN-94` Legal and ownership
- `SYN-95` Security and privacy
- `SYN-96` Usability in a clean environment
- `SYN-97` Project positioning and scope clarity
- `SYN-98` Contribution guide and maintenance expectations

## Current Summary

Synaply already has a stronger root README, a clearer product narrative, and a reproducible local deployment path. However, it is not yet ready for a public source-available release.

The main blockers today are:

- Sensitive local config has existed in git and history review is still pending
- The repository has not yet been validated from a clean environment from zero to running app
- Asset ownership and commercial-licensing communication still need final confirmation

## Readiness Status

| Issue | Goal | Current Status | Release Gate |
| --- | --- | --- | --- |
| `SYN-94` | Confirm the code and assets can be published and choose a license | In progress | Blocking |
| `SYN-95` | Remove secrets and verify git history safety | In progress | Blocking |
| `SYN-96` | Ensure a new developer can run the project from a clean machine | Partially done | Blocking |
| `SYN-97` | Explain clearly what Synaply is and what it is not | Mostly done | Important |
| `SYN-98` | Provide contribution and maintenance guidance | In progress | Important |

## Detailed Assessment

### `SYN-94` Legal and Ownership

Goal:
Make sure Synaply can legally be published, forked, and contributed to under a clearly declared license.

Current state:

- The root repository now includes a `LICENSE` file and the intended license is `Elastic License 2.0`.
- The root repository and child repositories now carry ELv2 license files, but the public commercial-licensing story still needs clearer maintainer-facing wording.
- There is no written confirmation yet that product assets, logos, copy, diagrams, and imported materials are all safe to publish publicly.

What needs to be confirmed:

- Whether ELv2 is the final long-term repository license or a temporary launch choice.
- Whether all UI assets, brand assets, screenshots, and design references are original or publishable.
- Whether the workspace packages should follow the same root license notices or need any package-specific clarification.
- How commercial licensing requests should be handled in public-facing docs.

Recommended next actions:

- Keep the root `LICENSE` file aligned with the intended ELv2 policy.
- Update workspace metadata where appropriate so the overall licensing story is consistent.
- Align workspace package metadata with the chosen policy.

### `SYN-95` Security and Privacy

Goal:
Make sure no secrets, local credentials, or unsafe configuration are exposed before the repo becomes public.

Current findings:

- [`supabase/.env.local`](./supabase/.env.local) has existed as a tracked local-secret file and should be removed from version control.
- The root [`.gitignore`](./.gitignore) now needs to stay aligned with local env-file exclusions.
- Local `supabase/config.toml` should remain untracked, while [`supabase/config.example.toml`](./supabase/config.example.toml) serves as the committed safe template.
- A real Google OAuth secret previously appeared in the tracked Supabase config and should be treated as a history-cleanup concern even though the current committed example is now safe.

Specific files to treat as high priority:

- [`supabase/.env.local`](./supabase/.env.local)
- local `supabase/config.toml`

Recommended next actions:

- Stop tracking local environment files and add `.env`, `.env.local`, and related patterns to [`.gitignore`](./.gitignore).
- Replace any committed OAuth secrets with environment-variable substitution.
- Rotate any secret that may already have been committed.
- Review git history, not only the current working tree, for leaked credentials before publishing.
- Add a root `SECURITY.md` with a responsible disclosure path and expected response policy.

Known history risk:

- Commit `b6eb558` added Google OAuth client credentials and should be treated as a history-cleanup candidate before the repository becomes public.

Release rule:
Do not publish the repository before secrets are removed from both the current tree and any reachable public history.

### `SYN-96` Usability in a Clean Environment

Goal:
A new developer should be able to clone the repo, install the workspace, start local Supabase, configure env files, and run frontend plus backend without tribal knowledge.

Current state:

- The root README documents the main stack, product shape, and local startup path.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) now documents the most realistic local setup: Docker-based Supabase plus separate backend and frontend services.
- The project now ships as a single-repository monorepo, which removes the earlier submodule setup friction.
- A clean-room validation run has not yet been documented as complete.

Remaining gaps:

- There is no explicit "clean machine checklist" proving that setup works from zero.
- There is no troubleshooting section for common failures such as missing Docker, missing Supabase CLI, port conflicts, or missing env values.
- The current deployment doc still references concrete local secret values for development, which is convenient internally but not ideal for a public repository.

Recommended next actions:

- Run a full clean-environment smoke test and record the exact steps that succeeded.
- Add a short troubleshooting section for the top startup failures.
- Replace hard-coded secret examples with safe placeholders where possible.
- Document the monorepo workflow clearly enough that first-time contributors are not guessing about workspace boundaries.

### `SYN-97` Positioning and Scope Clarity

Goal:
A public visitor should understand within a minute what Synaply is for, who it is for, and what it is intentionally not trying to be.

Current state:

- This area is already in much better shape.
- [`README.md`](./README.md) and [`readme/README.zh-CN.md`](./readme/README.zh-CN.md) now describe the target team size, core model, stack, and local setup.
- The product positioning is also reinforced by [`AGENTS.md`](./AGENTS.md), which gives strong product guardrails.

What is still worth tightening:

- Add a short "not for" statement in the public docs to reduce mismatch with people looking for a generic PM suite.
- Add one screenshot or architecture visual once the UI is stable enough to represent the product well.
- Keep roadmap language disciplined so the repo does not look like an unfinished general-purpose management platform.

Recommended next actions:

- Keep the current README direction.
- Add a small "non-goals" section later if confusion persists.
- Avoid documenting removed or legacy product surfaces.

### `SYN-98` Contribution Guide and Maintenance Expectations

Goal:
External contributors should know how to contribute, what kind of changes are welcome, how issues are triaged, and how maintainers respond.

Current state:

- The README contains a lightweight contribution section.
- Root-level `CONTRIBUTING.md` and `SECURITY.md` now exist, but they may still need wording polish before launch.
- There is no explicit maintenance policy, issue response expectation, PR review expectation, or support boundary.

Recommended next actions:

- Add a root `CONTRIBUTING.md`.
- Explain repo structure, workspace boundaries, setup expectations, coding norms, and what kinds of contributions are in scope.
- Add a short maintainer policy that covers feature requests, product-direction changes, support expectations, and review style.
- Add a root `SECURITY.md` instead of asking people to report security issues through public issues.

## Suggested Release Order

1. Resolve `SYN-95` first: remove secrets, rotate exposed credentials, and inspect git history.
2. Resolve `SYN-94`: confirm ownership, finalize the ELv2 + commercial-licensing story, and align workspace metadata.
3. Resolve `SYN-98`: polish contribution and security policies.
4. Resolve `SYN-96`: run and record a clean-environment verification.
5. Finish `SYN-97` polish: screenshots, non-goals, and tighter public presentation.

## Maintainer Decisions Still Needed

These decisions are still open and should be confirmed before the public launch:

- Whether all visual assets and written content are safe to publish
- What support commitment to promise in `CONTRIBUTING.md` and `SECURITY.md`
- How commercial-license inquiries should be routed
- Whether the current monorepo package boundaries are the right long-term public shape

## Exit Criteria for Public GitHub Release

Synaply is ready for a public GitHub launch only when all of the following are true:

- Root `LICENSE` exists and matches the intended ELv2 policy
- No secrets remain in tracked files
- Sensitive history has been reviewed and cleaned if necessary
- Root `CONTRIBUTING.md` exists
- Root `SECURITY.md` exists
- README and deployment docs match the real onboarding path
- A clean-environment run has been completed successfully
