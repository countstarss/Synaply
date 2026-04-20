---
name: migrate-synaply-supabase-cloud
description: Migrate the Synaply repository schema and Supabase infrastructure to a Supabase Cloud project. Use when Codex needs to deploy `apps/backend/prisma/migrations` and `supabase/migrations` to a remote Supabase database, verify migration status, or repeat the Synaply Cloud cutover workflow after env variables have been configured.
---

# Migrate Synaply Supabase Cloud

## Overview

Deploy Synaply's remote database in two layers:

1. Apply Prisma business-schema migrations from `apps/backend/prisma/migrations`
2. Apply Supabase infrastructure migrations from `supabase/migrations`

Use this skill only for the Synaply repo layout. The workflow assumes the repository contains:

- `apps/backend/prisma/prisma.config.ts`
- `apps/backend/prisma/migrations`
- `supabase/config.toml`
- `supabase/migrations`

## Preconditions

Check these files before running any migration command:

- `apps/backend/.env`
- `apps/frontend/.env.local` only if you also want to sanity-check frontend wiring after migration

Require these backend env vars:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `JWT_SECRET`

Prefer `DIRECT_URL` for all remote migration work. Do not rely on pooled URLs for schema deployment when a direct connection is available.

Why:

- Prisma migration commands are safer over a direct connection
- `supabase db push --db-url ...` works without `supabase link`
- This repo may not be linked to the target Cloud project, so `--db-url "$DIRECT_URL"` is the stable path

## Guardrails

Follow these rules every time:

- Inspect command help first if the installed CLI version is unknown:
  ```bash
  supabase --version
  supabase db --help
  supabase migration --help
  ```
- Do not assume the repo is linked to the Cloud project.
- Do not run `supabase link` unless the user explicitly wants that repo state change.
- Do not push Supabase migrations before Prisma migrations in this repo. Several Supabase SQL migrations reference application tables created by Prisma migrations.
- Source backend env explicitly before commands instead of assuming the shell already has the variables:
  ```bash
  set -a
  source apps/backend/.env
  set +a
  ```

## Workflow

### 1. Inspect the local migration sets

Confirm both migration directories exist and are populated:

```bash
find apps/backend/prisma/migrations -maxdepth 2 -type f | sort
find supabase/migrations -maxdepth 2 -type f | sort
```

### 2. Confirm the remote target and current status

After loading `apps/backend/.env`, use `DIRECT_URL` for all remote checks:

```bash
set -a
source apps/backend/.env
set +a
export TARGET_DB_URL="$DIRECT_URL"
```

Check Supabase migration history:

```bash
supabase migration list --db-url "$TARGET_DB_URL"
```

Check Prisma migration status from `apps/backend`:

```bash
cd apps/backend
export DATABASE_URL="$DIRECT_URL"
pnpm exec prisma migrate status --config prisma/prisma.config.ts
cd ../..
```

If Prisma says the database is already up to date, keep going anyway and still check the Supabase migration state.

### 3. Apply Prisma business-schema migrations first

Run:

```bash
cd apps/backend
export DATABASE_URL="$DIRECT_URL"
pnpm exec prisma migrate deploy --config prisma/prisma.config.ts
cd ../..
```

Expected result:

- Prisma loads `prisma/prisma.config.ts`
- Pending migrations from `apps/backend/prisma/migrations` are applied
- A final success line reports all migrations applied or schema already up to date

If this fails because env is missing, confirm `apps/backend/.env` exists and contains `DATABASE_URL` and `DIRECT_URL`.

### 4. Dry-run Supabase infrastructure migrations

Before pushing remote Supabase SQL, inspect the plan:

```bash
supabase db push --dry-run --db-url "$TARGET_DB_URL"
```

Expected result:

- Either `Remote database is up to date.`
- Or a list of pending files from `supabase/migrations`

### 5. Apply Supabase infrastructure migrations

Run:

```bash
supabase db push --db-url "$TARGET_DB_URL"
```

This may prompt for confirmation. Approve it if the listed migration files match the expected pending set.

For this repo, typical files include:

- avatar bucket / storage policy setup
- Realtime topic ACL functions and policies
- Realtime trigger functions for issues, inbox, project summary, and comments

### 6. Re-verify everything

Run all three checks after deployment:

```bash
cd apps/backend
export DATABASE_URL="$DIRECT_URL"
pnpm exec prisma migrate status --config prisma/prisma.config.ts
cd ../..
supabase migration list --db-url "$TARGET_DB_URL"
supabase db push --dry-run --db-url "$TARGET_DB_URL"
```

Success means:

- Prisma reports the database schema is up to date
- `supabase migration list` shows local and remote rows aligned
- Supabase dry run reports the remote database is up to date

## Optional Frontend Sanity Check

If the user is cutting over to Supabase Cloud, inspect `apps/frontend/.env.local` and confirm:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`

Do not keep `service_role` keys in frontend env files. If a frontend env contains `service_role_key`, flag it and recommend removing it.

## Troubleshooting

### Prisma ignores env or says datasource.url is required

Use the repo's Prisma config explicitly:

```bash
pnpm exec prisma migrate deploy --config prisma/prisma.config.ts
```

Also export `DATABASE_URL="$DIRECT_URL"` in the same shell before running Prisma commands.

### `supabase migration list` says no project ref

Do not switch to `supabase link` by default. Use:

```bash
supabase migration list --db-url "$DIRECT_URL"
```

### Remote migration hangs or behaves oddly over pooler

Switch to `DIRECT_URL` explicitly and retry. In this repo, direct connection is the default migration path.

### Supabase dry-run shows pending files after a supposedly successful push

Re-run:

```bash
supabase migration list --db-url "$DIRECT_URL"
```

If remote rows are still missing, inspect the failed command output and stop before retrying repeatedly.

## Completion Checklist

Before reporting success, confirm all of the following:

- Backend env loaded successfully
- Prisma migrations deployed or already up to date
- Supabase migrations deployed or already up to date
- Final Prisma status is clean
- Final Supabase migration list is aligned
- Final Supabase dry-run is clean
- Any frontend Cloud env issue discovered during sanity check is called out explicitly
