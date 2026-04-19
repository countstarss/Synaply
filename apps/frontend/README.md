# Synaply Frontend

Synaply Frontend 是 Synaply 的前端应用，负责提供产品界面、国际化路由、协作文档体验、Workflow 可视化，以及围绕 Projects / Issues / Docs / Inbox 的核心交互。

它不是一个独立的“认证系统示例项目”，而是 Synaply 这套协作产品的用户界面层。

如果你想先了解整个项目的定位、仓库关系和完整本地部署方式，建议优先查看根仓库文档。

## 前端职责

这个仓库当前主要负责：

- 基于 Next.js App Router 的产品界面与页面结构
- 多语言路由与国际化内容加载
- Projects、Issues、Docs、Inbox、Settings 等核心产品页面
- Workflow 可视化与交互编辑体验
- Supabase 前端认证接入
- 与后端 API 的数据通信
- AI workbench 与相关交互界面

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives
- `next-intl`
- Framer Motion
- TanStack Query
- Zustand
- Supabase SSR / Supabase JS
- BlockNote
- React Flow
- Yjs

## 当前能力

从当前代码结构看，前端已经包含这些主要能力区域：

- `app/[locale]` 下的国际化页面路由
- `components/projects` 项目相关界面
- `components/issue` Issue 相关界面
- `components/workflow` Workflow 相关界面
- `components/inbox` Inbox 相关界面
- `components/auth` 认证相关界面
- `components/settings` 设置页与成员管理
- `components/ai` AI workbench 与线程界面
- `lib/realtime`、`hooks/realtime` 下的实时能力接入
- `lib/data`、`lib/fetchers` 下的数据获取与客户端封装

这些能力共同服务于 Synaply 的核心产品链路：

`Project -> Issue -> Workflow -> Doc -> Inbox`

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

先复制或补全本地环境变量：

```bash
cp .env.example .env.local
```

最关键的变量是：

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-supabase-anon-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:5678
NEXT_PUBLIC_BACKEND_DEV_URL=http://localhost:5678
```

如果你需要启用 AI runtime，还需要补充：

```env
LLM_BASE_URL=
LLM_MODEL=
LLM_API_KEY=
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 对应本地 Supabase
- `NEXT_PUBLIC_BACKEND_URL` 指向 `apps/backend`
- 本仓库不应提交真实 `.env.local`

### 3. 启动开发服务器

```bash
pnpm dev
```

默认访问地址：

- Frontend: [http://localhost:3000](http://localhost:3000)

如果你在完整联调环境中开发，建议同时启动：

- 本地 Supabase
- `apps/backend`

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## 专项文档

- [SEO 第二阶段执行清单](./readme/SEO%E7%AC%AC%E4%BA%8C%E9%98%B6%E6%AE%B5%E6%89%A7%E8%A1%8C%E6%B8%85%E5%8D%95.md)

## 页面与模块结构

```text
apps/frontend/
├── src/app/              # App Router 页面与 API routes
├── src/components/       # 产品组件
│   ├── ai/
│   ├── auth/
│   ├── inbox/
│   ├── issue/
│   ├── projects/
│   ├── settings/
│   ├── workflow/
│   └── ui/
├── src/i18n/             # 国际化配置与文案
├── src/lib/              # 数据访问、AI、realtime、类型与工具
├── src/providers/        # 全局 provider
├── src/stores/           # 客户端状态
└── src/hooks/            # 业务 hooks
```

## 设计与产品原则

这个前端仓库不应被理解成一个“什么都往里塞”的 Next.js 壳子。它服务于 Synaply 的产品边界：

- 强化跨角色 handoff 和协作上下文
- 降低远程团队中的状态追问与信息散落
- 让项目、事项、流程、文档和收件箱形成一个连贯界面

不建议把它快速扩展成：

- chat-first 产品
- 泛化的大而全项目管理套件
- 重型 planning / gantt / timesheet 系统

## 与后端的关系

`apps/frontend` 不是独立产品，而是 Synaply 的前端界面层。

前端负责：

- 页面结构与交互体验
- 国际化与用户界面
- 富文本、流程图、状态面板等前端能力
- API 数据展示与用户操作发起

后端负责：

- 领域逻辑
- 权限校验
- 数据持久化
- GraphQL / REST 暴露

## 本地联调建议

如果你是从根仓库一起开发，推荐按这个顺序：

1. 启动本地 Supabase
2. 启动 `apps/backend`
3. 启动 `apps/frontend`

完整说明请参考根仓库的 `DEPLOYMENT.md`。

## Contributing

欢迎提交 issue、PR 和围绕产品方向的高质量反馈。

更完整的贡献与仓库策略，请参考根仓库的 `CONTRIBUTING.md`。

## License

本仓库当前采用 `Elastic License 2.0 (ELv2)`。

这意味着源码公开可见并可在许可范围内使用，但不应被表述成标准 OSI 开源项目。更准确的说法是：`source-available`。

如果要将 Synaply 本身作为 hosted / managed service 对外提供，需要额外的商业授权。
