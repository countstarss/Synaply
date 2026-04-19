# Synaply Deployment

本文档不追求覆盖所有上线平台，而是先把当前仓库最真实、最可复现的一条部署路径写清楚：

- 本地使用 Supabase CLI 通过 Docker 启动基础服务
- 单独启动 `apps/backend`
- 单独启动 `apps/frontend`

这也是当前项目最适合开发和联调的运行方式。

## Deployment Topology

当前仓库的运行结构是：

1. `supabase/`
   负责本地 PostgreSQL、Auth、Storage、Studio、Realtime 等基础能力
2. `apps/backend/`
   负责业务 REST API、Swagger、Prisma、认证校验、项目/事项/流程/文档等领域逻辑
3. `apps/frontend/`
   负责产品界面、国际化路由、Supabase 前端认证、工作流可视化、文档编辑等体验层

## Current Local Ports

按当前仓库配置，本地默认端口如下：

| Service | URL / Port | Source |
| --- | --- | --- |
| Frontend | `http://localhost:3000` | Next.js 默认端口 |
| Backend | `http://localhost:5678` | `apps/backend/.env.example` |
| Backend health | `http://localhost:5678/health` | Nest controller |
| Backend Swagger | `http://localhost:5678/api` | `src/main.ts` |
| Supabase API | `http://127.0.0.1:54321` | `supabase/config.toml` |
| Supabase Postgres | `127.0.0.1:54322` | `supabase/config.toml` |
| Supabase Studio | `http://127.0.0.1:54323` | `supabase/config.toml` |
| Supabase Inbucket | `http://127.0.0.1:54324` | `supabase/config.toml` |

## Prerequisites

开始前请先确认本机具备：

- Node.js 20.19+ or 22.12+
- pnpm
- Docker Desktop 或可用的 Docker Engine
- Supabase CLI
- Git

建议先确认版本：

```bash
node -v
pnpm -v
docker --version
supabase --version
```

说明：

- 当前机器上的 Supabase CLI 版本是 `v2.26.9`
- 本文档只使用 `supabase start`、`supabase status` 这类基础命令，避免依赖新版 CLI 才有的能力

## 1. Clone Repository

```bash
git clone <your-repo-url>
cd Synaply
```

## 2. Start Local Supabase with Docker

If this is a fresh clone, first create your local Supabase config from the tracked example:

```bash
cp supabase/config.example.toml supabase/config.toml
```

在仓库根目录执行：

```bash
supabase start
```

这一步会基于本地 `supabase/config.toml` 启动服务。仓库中提交的是 [`supabase/config.example.toml`](./supabase/config.example.toml)，用于提供默认结构与安全示例；真实本地配置应保留在未跟踪的 `supabase/config.toml` 中。

当前项目默认配置了：

- API 端口 `54321`
- DB 端口 `54322`
- Studio 端口 `54323`
- Inbucket 端口 `54324`
- 本地站点地址 `http://127.0.0.1:3000`
- 本地认证回调地址：
  - `http://127.0.0.1:3000/auth/callback`
  - `http://127.0.0.1:3000/zh/auth/callback`
  - `http://127.0.0.1:3000/ko/auth/callback`
  - `http://127.0.0.1:3000/ja/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/zh/auth/callback`
  - `http://localhost:3000/ko/auth/callback`
  - `http://localhost:3000/ja/auth/callback`

补充说明：

- 公开仓库中的 Google OAuth provider 现在默认是关闭的。
- 如果你需要本地调试 Google 登录，请在本机环境中提供 `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` 和 `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`，然后再按需启用本地 `supabase/config.toml` 里的对应 provider 配置。

启动后，建议马上执行：

```bash
supabase status
```

你会拿到当前本地环境最关键的几项值：

- `API URL`
- `DB URL`
- `JWT secret`
- `anon key`
- `service_role key`

对于 Synaply 当前本地开发来说，最常用的是：

- `API URL`
- `DB URL`
- `JWT secret`
- `anon key`

## 3. Backend Environment

先复制环境变量模板：

```bash
cp apps/backend/.env.example apps/backend/.env
```

当前后端最小必填环境变量如下：

```env
PORT=5678
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
JWT_SECRET=replace-with-your-supabase-jwt-secret
```

结合当前项目配置，本地推荐直接写成：

```env
PORT=5678
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

这里有两个关键点：

1. `DATABASE_URL`
   必须指向本地 Supabase 启动出来的 Postgres 实例。当前仓库默认就是 `127.0.0.1:54322`
2. `JWT_SECRET`
   后端启动时会校验这个值，而且长度必须至少 32 位。当前示例配置 `supabase/config.example.toml` 中已经给出了本地开发默认值：
   `super-secret-jwt-token-with-at-least-32-characters-long`

如果你不想手写，也可以直接从 `supabase status` 的输出里复制 `DB URL` 和 `JWT secret`。

## 4. Frontend Environment

先复制模板：

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

前端当前最关键的环境变量如下：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-your-supabase-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5678
NEXT_PUBLIC_BACKEND_DEV_URL=http://localhost:5678

LLM_BASE_URL=
LLM_MODEL=claude-sonnet-4-6
LLM_API_KEY=
ANTHROPIC_API_KEY=
```

结合当前本地配置，推荐最小配置如下：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy-from-supabase-status-anon-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:5678
NEXT_PUBLIC_BACKEND_DEV_URL=http://localhost:5678
```

补充说明：

- `NEXT_PUBLIC_SUPABASE_URL`
  对应本地 Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  建议直接从 `supabase status` 输出中复制 `anon key`
- `NEXT_PUBLIC_BACKEND_URL`
  当前前端会优先读取它
- `NEXT_PUBLIC_BACKEND_DEV_URL`
  仍被支持，但本质上是 fallback
- `NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET`
  是可选项，不填时默认使用 `avatars`

AI 相关变量不是前端主站启动的绝对前提，但如果你要启用 AI runtime，就还需要补上：

- `LLM_BASE_URL`
- `LLM_MODEL`
- `LLM_API_KEY`

或官方 Anthropic 兼容变量：

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_BASE_URL`

## 5. Install Dependencies

当前仓库已经是统一的 pnpm workspace monorepo，依赖可以在根目录一次性安装：

```bash
pnpm install
```

## 6. Start the Two Services

### Terminal 1: start backend

```bash
pnpm dev:backend
```

成功后，后端应监听在：

- `http://localhost:5678`

并提供：

- health: `GET /health`
- swagger: `/api`

### Terminal 2: start frontend

```bash
pnpm dev:frontend
```

成功后，前端默认运行在：

- `http://localhost:3000`

## 7. Verification Checklist

建议按下面顺序验证：

### Infrastructure

1. 确认 Supabase 在运行：

```bash
supabase status
```

2. 打开 Supabase Studio：

- [http://127.0.0.1:54323](http://127.0.0.1:54323)

### Backend

1. 访问健康检查：

- [http://localhost:5678/health](http://localhost:5678/health)

2. 打开 Swagger：

- [http://localhost:5678/api](http://localhost:5678/api)

### Frontend

1. 打开首页：

- [http://localhost:3000](http://localhost:3000)

2. 验证认证页和回调路由是否可访问

3. 验证前端是否能正常请求后端 `http://localhost:5678`

## Current Config Notes

基于当前代码和配置，下面这些点很重要：

### 1. Backend auth config is strict

后端不会容忍缺失或过短的 `JWT_SECRET`。如果这个值没有配置，或者长度不足 32，服务会直接启动失败。

### 2. Frontend hard-depends on Supabase public config

如果缺少：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

前端会直接抛错。

### 3. Backend URL has a local fallback

前端在没有显式配置时，会 fallback 到：

```text
http://localhost:5678
```

但为了避免环境漂移，仍建议在 `.env.local` 里显式设置：

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_BACKEND_DEV_URL`

## Troubleshooting

### `supabase start` fails

优先检查：

- Docker 是否已经启动
- 54321 / 54322 / 54323 / 54324 端口是否被占用
- Supabase CLI 是否可执行

### Backend fails with `DATABASE_URL is not defined`

说明 `apps/backend/.env` 没有生效，或者 `DATABASE_URL` 未正确填写。

### Backend fails with `JWT_SECRET is required` or `must be at least 32 characters long`

说明你没有把本地 Supabase 的 JWT secret 正确写进后端环境变量。

### Frontend fails with missing Supabase env error

说明 `apps/frontend/.env.local` 缺少：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Auth callback redirects unexpectedly

当前本地 Supabase 已经预置了这些回调地址：

- `/auth/callback`
- `/zh/auth/callback`
- `/ko/auth/callback`
- `/ja/auth/callback`

如果你改了前端端口或域名，需要同步修改本地 `supabase/config.toml` 里的：

- `site_url`
- `additional_redirect_urls`

## Production Note

README 中不再展开详细部署流程，是因为生产环境部署方式可能会因平台不同而变化。

如果后续要补生产环境版本，建议单独追加这些章节，而不是混在本地部署说明里：

- Frontend production deployment
- Backend production deployment
- Managed Supabase project configuration
- Domain, CORS, and auth callback setup
