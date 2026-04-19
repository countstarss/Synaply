---
name: synaply-localization
description: "Operate Synaply's project-specific localization workflow for the Next.js + next-intl frontend. Use when translating or updating user-facing copy in `synaply-frontend`, syncing `en`/`zh`/`ko`/`ja` message JSON files, adding a locale, replacing hardcoded strings with translation keys, validating ICU placeholders, or keeping `routing.ts`, `request.ts`, `merge-messages.ts`, and `LanguageSwitcher.tsx` aligned."
---

# Synaply Localization

## Overview

Use this skill for Synaply frontend localization work. It packages the usage patterns of the installed `next-intl-add-language` and `i18n-localization` skills into a repo-specific workflow, so the agent can move directly from request to implementation.

Start by reading [references/project-map.md](references/project-map.md).

## Task Routing

- Follow the locale sync workflow when the task is translating existing messages, filling gaps in `zh`/`ko`/`ja`, or adding a new locale.
- Follow the hardcoded copy workflow when the task is moving UI literals into translation keys.
- If the task touches both locale files and components, update locale files first, then refactor components to consume the new keys.

## Locale Sync Workflow

1. Treat `synaply-frontend/src/i18n/messages/en` as the source of truth for file inventory and key structure.
2. Keep locale folders aligned with the English tree. Do not invent a different nesting pattern in translated locales.
3. Translate values only. Do not rename keys, flatten objects, change array shapes, or alter ICU placeholders, plural branches, or select branches.
4. Prefer touching only the smallest relevant JSON files instead of rewriting entire locale trees.
5. Preserve established product terminology already used in Synaply's locale files unless the user explicitly asks for a copy rewrite.
6. Remember that `merge-messages.ts` falls back to English for missing keys. This is a safety net, not an excuse to leave user-facing gaps in shipped locales.

## Add Locale Workflow

1. Read `~/.codex/skills/next-intl-add-language/SKILL.md` for the base checklist.
2. Update `synaply-frontend/src/i18n/routing.ts` with the new locale code.
3. Verify request loading behavior in `synaply-frontend/src/i18n/request.ts`.
4. Ensure the locale can be merged correctly through `synaply-frontend/src/i18n/merge-messages.ts`.
5. Add the locale option to `synaply-frontend/src/components/LanguageSwitcher.tsx`.
6. Create the same file tree under `synaply-frontend/src/i18n/messages/<locale>` that exists under `en`.
7. Validate placeholders and spot-check route switching after the change.

## Hardcoded Copy Workflow

1. Read `~/.codex/skills/i18n-localization/SKILL.md` if the task involves general i18n hygiene or formatting rules.
2. Search touched TS and TSX files for user-visible literals with `rg`.
3. Move each literal into the most appropriate namespace JSON file under `synaply-frontend/src/i18n/messages/en`.
4. Add matching translations in `zh`, `ko`, and `ja` for every new key introduced in the same change.
5. Use `useTranslations`, `getTranslations`, or existing locale-aware helpers already used by nearby code. Follow the local pattern instead of introducing a parallel abstraction.
6. Avoid string concatenation for localized UI. Prefer complete translation entries and ICU message syntax when interpolation or pluralization is needed.

## Synaply Product Rules

- Follow the repository guardrails in `AGENTS.md`.
- Sidebar and navigation may keep short obvious English labels such as `My Work`, `Inbox`, `Docs`, `Issues`, `Projects`, and `Workflows`.
- Newly introduced hardcoded user-facing copy must be internationalized in the same change.
- Product prompts, empty states, validation, toasts, and action guidance should not be left as temporary hardcoded strings.

## Validation

1. Run:
   `node synaply-frontend/scripts/validate-i18n-placeholders.js`
2. If locale files changed, compare the touched locale against `en` for missing keys or placeholder drift.
3. If a new locale was added, verify `routing.ts`, `request.ts`, `merge-messages.ts`, and `LanguageSwitcher.tsx` stay consistent.
4. If components were refactored, search touched files again to ensure no leftover user-visible literals remain.

## Useful References

- Read [references/project-map.md](references/project-map.md) first for the exact Synaply paths and validation commands.
- Read `synaply-frontend/readme/INTERNATIONALIZATION.md` when you need additional repo-specific context on how the frontend i18n setup evolved.

## Out Of Scope

- README localization. Use a dedicated README translation skill for that workflow.
- Backend-only text generation that does not ship through the frontend locale system.
