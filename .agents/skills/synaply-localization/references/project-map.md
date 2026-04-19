# Synaply Localization Project Map

## Scope

This skill is for the frontend app at:

- `synaply-frontend/`

## Current Locale Setup

- Default locale: `en`
- Supported locales: `en`, `zh`, `ko`, `ja`
- URL behavior: English has no prefix, other locales use `/<locale>`

## Important Paths

- Message root: `synaply-frontend/src/i18n/messages`
- English source tree: `synaply-frontend/src/i18n/messages/en`
- Chinese tree: `synaply-frontend/src/i18n/messages/zh`
- Korean tree: `synaply-frontend/src/i18n/messages/ko`
- Japanese tree: `synaply-frontend/src/i18n/messages/ja`
- Route config: `synaply-frontend/src/i18n/routing.ts`
- Request loader: `synaply-frontend/src/i18n/request.ts`
- Message merge logic: `synaply-frontend/src/i18n/merge-messages.ts`
- Locale middleware: `synaply-frontend/src/middleware.ts`
- Language switcher UI: `synaply-frontend/src/components/LanguageSwitcher.tsx`
- Placeholder validation script: `synaply-frontend/scripts/validate-i18n-placeholders.js`
- Internal i18n notes: `synaply-frontend/readme/INTERNATIONALIZATION.md`

## Operational Notes

- `merge-messages.ts` deep-merges a locale over English, so missing keys fall back to English values.
- Keep locale file names and nesting aligned with the English tree even though fallback exists.
- Product guardrails allow short English in core navigation labels, but new user-facing copy must still be internationalized in the same change.

## Validation Commands

Run placeholder validation after touching message files:

```bash
node synaply-frontend/scripts/validate-i18n-placeholders.js
```

Useful search patterns:

```bash
rg -n "useTranslations|getTranslations|useLocale" synaply-frontend/src
rg -n "\"[^\"]*[A-Za-z][^\"]*\"" synaply-frontend/src --glob '*.{ts,tsx}'
```
