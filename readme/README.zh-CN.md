<p align="center">
  <img src="../public/synaply-logo.png" alt="Synaply logo" width="120" />
</p>

<h1 align="center">Synaply</h1>

<p align="center">
  面向小型初创团队的远程协作软件。
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./README.ko.md">한국어</a> ·
  <a href="./README.ja.md">日本語</a>
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

## 项目简介

<p align="center">
  <img alt="Synaply product preview" src="../public/synaply-1.png" />
</p>

Synaply 是一款帮助小型初创团队实现快速远程协作的软件，核心目标不是“管理更多任务”，而是让项目、事项、流程、文档与收件箱形成一个连贯的执行上下文，减少来回追问、降低协作摩擦，并让交接与推进更加清晰。

它不是一个泛化的项目管理大而全平台，而是一个围绕“把工作顺畅推进到交付”的产品。

## 为什么做 Synaply

远程团队的卡点通常不在于不会创建任务，而在于：

- 交接责任不清晰
- 阻塞信息不透明
- 决策上下文散落
- 团队成员不知道现在最该处理什么

Synaply 试图把这些关键时刻结构化：

- 用 `Project` 定义范围和方向
- 用 `Issue` 承载具体动作
- 用 `Workflow` 表达进度和交接
- 用 `Doc` 保存上下文与决策
- 用 `Inbox` 聚合变化和待处理事项

## 核心对象模型

Synaply 的核心链路是：

`Project -> Issue -> Workflow -> Doc -> Inbox`

这条链路是整个产品的中心。新功能应当强化它，而不是把产品带向内建聊天、重型排期工具，或企业级流程引擎。

## 当前包含的能力

- 面向团队协作的项目与工作空间结构
- 带有负责人、优先级、状态流转的 Issue 管理
- 可视化的 Workflow 编辑与步骤推进
- 与执行对象绑定的文档系统，而不是孤立知识库
- 面向异步协作的 Inbox / Activity 能力
- AI 执行与 AI 线程相关模块
- Team、Comment、Calendar、Task 等围绕协作闭环的支撑模块
- 基于国际化路由的多语言前端结构

## 架构说明

当前仓库已经收口为一个单仓库 pnpm workspace monorepo：

- [`apps/frontend`](../apps/frontend)：Next.js 前端应用
- [`apps/backend`](../apps/backend)：NestJS 后端服务
- [`supabase`](../supabase)：本地 Supabase 配置、迁移与种子数据

整体分工如下：

- 前端负责产品界面、客户端状态、文档编辑、流程可视化和国际化路由
- 后端负责项目、事项、流程、文档、收件箱、认证、AI 执行等领域接口
- Supabase 负责认证与基于 PostgreSQL 的本地开发基础设施

## 技术栈

### 平台与基础能力

- 前端：Next.js 15、React 19、TypeScript
- 后端：NestJS 10、REST API、Swagger
- 数据库：PostgreSQL
- 认证与本地开发基础设施：Supabase
- ORM：Prisma 7

### UI 与前端体验

- Tailwind CSS 4
- Radix UI primitives
- shadcn/ui 风格的组件组织方式
- Framer Motion
- Sonner
- next-intl

### 文档协作与流程可视化

- BlockNote 富文本编辑器
- React Flow 流程图编辑与展示
- Yjs、`y-websocket`、`y-indexeddb` 用于协作 / 本地优先编辑支持
- `@dnd-kit/react` 用于交互拖拽能力

### AI 与数据层

- 自定义 Anthropic 兼容 AI runtime
- TanStack Query
- Zustand
- Dexie

## 主要开源库

如果你想快速了解这个项目重点依赖了哪些开源库，可以先看这些：

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

## 快速开始

### 前置要求

- Node.js 20.19+ 或 22.12+
- pnpm
- Supabase CLI

### 1. 克隆仓库

```bash
git clone <your-repo-url>
cd Synaply
```

### 2. 启动本地 Supabase

在仓库根目录执行：

```bash
supabase start
```

项目已经在 [`supabase`](../supabase) 中提供了本地开发所需的配置、迁移和种子数据。

### 3. 配置环境变量

后端：

```bash
cp apps/backend/.env.example apps/backend/.env
```

前端：

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

关键变量如下：

- 后端：`PORT`、`CORS_ORIGINS`、`DATABASE_URL`、`SUPABASE_URL`、`JWT_SECRET`
- 前端：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_BACKEND_URL`
- AI 相关服务端变量：`LLM_BASE_URL`、`LLM_MODEL`、`LLM_API_KEY`，或 `ANTHROPIC_API_KEY`

### 4. 安装依赖

在仓库根目录一次性安装整个 workspace 的依赖：

```bash
pnpm install
```

### 5. 启动服务

后端，单独一个终端中执行：

```bash
pnpm dev:backend
```

前端，在另一个终端中执行：

```bash
pnpm dev:frontend
```

### 6. 打开本地地址

- 前端应用：[http://localhost:3000](http://localhost:3000)
- 后端健康检查：[http://localhost:5678/health](http://localhost:5678/health)
- 后端 Swagger：[http://localhost:5678/api](http://localhost:5678/api)
- Supabase Studio：[http://127.0.0.1:54323](http://127.0.0.1:54323)

## 仓库结构

```text
Synaply/
├── supabase/             # 本地 Supabase 配置、迁移与种子数据
├── apps/                 # 应用工作区
│   ├── backend/          # NestJS 后端服务
│   └── frontend/         # Next.js 前端应用
├── DEPLOYMENT.md         # 部署说明
├── AGENTS.md             # 产品与 Agent 协作约束
└── notes/                # 产品与规划笔记
```

## API 与开发入口

- REST 健康检查：`GET /health`
- Swagger 文档：`/api`
- 前端国际化页面位于 [`apps/frontend/src/app/[locale]`](../apps/frontend/src/app/%5Blocale%5D)

## 部署

详细部署说明与本地运行方式请查看 [`DEPLOYMENT.md`](../DEPLOYMENT.md)。

如果你正在以“公开发布到 GitHub”为目标推进项目，也建议同时查看开源准备清单 [`OPEN_SOURCE_READINESS.md`](../OPEN_SOURCE_READINESS.md)。

## 项目状态

Synaply 当前处于持续开发阶段。仓库已经包含主要产品骨架，但 README 更适合作为产品地图，而不是表示所有交互和流程都已完全定稿。

当前最重要的产品方向仍然是：

- 强化 `Project -> Issue -> Workflow -> Doc -> Inbox` 这条主链路
- 让交接和阻塞信息更加显式
- 在不把产品做成聊天工具的前提下，提升异步协作可见性

## 贡献方式

欢迎提交 Issue、Pull Request，以及围绕产品方向的高质量反馈。

贡献流程与预期请查看 [`CONTRIBUTING.md`](../CONTRIBUTING.md)。

如果你准备参与贡献，建议优先做这些类型的改进：

- 让跨角色交接更清晰
- 减少远程协作中的重复确认和状态追问
- 加强项目、事项、流程、文档之间的上下文连接

不建议在核心协作闭环尚未成熟前，把产品快速扩展成“大而全”的管理套件。

## 许可证

Synaply 当前采用 [`Elastic License 2.0`](../LICENSE)。

这意味着仓库可以公开发布、查看源码并在许可范围内使用，但不应被表述成 OSI 意义上的标准开源项目。更准确的说法是：`source-available`。

在 ELv2 下，个人使用、公司内部使用、修改和再分发都可以进行；如果要把 Synaply 本身作为 hosted / managed service 对外提供，则需要额外的商业授权安排。

安全问题报告方式请查看 [`SECURITY.md`](../SECURITY.md)。
