# AI Agent V1 — 前端架构与实施计划

## 这份文档解决什么问题

`ai-execution` 后端能力已经存在，但它目前只是一个“受控写动作层”。

要让这个能力在产品里真正可用，还需要一层前端与 LLM 之间的 agent runtime，把：

1. 用户自然语言
2. 当前页面上下文
3. 系统真实对象状态
4. 后端受控动作

接成一条完整链路。

这份文档要明确的不是“AI 最终会多智能”，而是：

`接下来应该如何把 Synaply 的第一个可用 agent 架构落地`

---

## 结论先行

Synaply 的 AI Agent V1 采用下面的分层：

1. `Frontend UI`
   - 负责 AI thread UI、消息渲染、确认卡、工具结果展示。
   - 不直接调用模型，不直接持有业务写权限。

2. `Next.js Agent Runtime`
   - 运行 LLM、管理 tool loop、负责 streaming。
   - 读取线程状态、调用 read tools、调用 execute tools。
   - 是前端和后端之间的 AI BFF。

3. `Nest Backend Authority`
   - 继续作为真实业务 authority。
   - 负责线程持久化、上下文读取接口、已有的 `ai-execution` 写动作层、审计记录。

4. `Database`
   - 持久化 AI thread、message、run、pending approval。
   - 不让 agent 状态只存在于浏览器内存里。

这意味着：

- 模型运行放在 `Next.js server route`，不是浏览器。
- 真实业务写操作继续走后端 `ai-execution`。
- AI thread 不复用现有 team chat 的数据模型。
- V1 先做 `single agent + tool loop + confirmation`，不做 multi-agent。

---

## 为什么这样选

### 1. 为什么不是“前端直接调模型”

因为浏览器不应该：

1. 持有 provider secret。
2. 直接决定业务写动作。
3. 在本地维护不可恢复的 agent 状态。

浏览器只应该负责 UI。

### 2. 为什么不是“把 agent runtime 直接写进 Nest”

Nest 当然可以做，但当前前端是 Next.js，最适合承接：

1. LLM streaming
2. UIMessage transport
3. tool trace 渲染
4. human-in-the-loop 中断与恢复

V1 更适合把 agent runtime 放在 Next 的 `app/api` 层。

### 3. 为什么不是直接复用现有 `/chat`

当前 `/chat` 主要是历史聊天壳，不是 agent thread。

可以复用：

1. 布局容器
2. 某些列表/输入框/消息泡泡的视觉组件

不能复用：

1. 频道模型
2. 普通消息结构
3. “消息就是一段文本”的假设

AI thread 需要支持：

1. assistant text
2. tool call
3. tool result
4. approval card
5. error card
6. structured context chips

所以 UI 可以借壳，数据模型不能混用。

---

## 推荐参考

### 首选参考：Vercel AI SDK

V1 最推荐参考 `Vercel AI SDK` 的整体形态。

原因：

1. 我们的前端本身就是 Next.js。
2. 它天然适合 `useChat / stream / tool loop / UI message parts`。
3. provider-neutral，不会把 Synaply 锁死在某一家模型供应商。
4. 很适合“产品内 agent”，而不是命令行 agent。

### 概念参考：Gemini CLI

Gemini CLI 最值得借鉴的是思路，不是 UI：

1. 读上下文再执行。
2. 工具分层。
3. 敏感动作确认。
4. 工具循环而不是一次性生成。

这些原则很适合 Synaply。

### 能力参考：OpenAI Agents SDK

如果以后需要更强的：

1. session
2. human-in-the-loop
3. run resume
4. handoff

可以参考 OpenAI Agents SDK 的 session / HITL 设计。

但 V1 不建议被供应商绑定。

### 暂不采用：LangGraph 作为前台 V1 主架构

LangGraph 更适合后续：

1. async digest
2. background risk scan
3. weekly summary
4. 长时运行 agent

V1 前台交互 agent 不需要先上 LangGraph。

---

## V1 的产品目标

V1 要做到的是：

1. 用户在当前页面和 AI 对话。
2. AI 能读当前对象上下文，而不是只靠猜。
3. AI 能把对话转成结构化 payload。
4. AI 能调用真实系统动作。
5. 对需要确认的动作，AI 会先预演再请求确认。
6. 确认后，AI 能继续执行并总结结果。
7. AI 能把一个 issue 整理成可以直接交给外部编码 agent（claude / codex）使用的 prompt，并把这段 prompt 落到 issue 上。

> Synaply 的定位不是构建编码 agent，而是构建一个能理解意图、推进协作对象、并为外部编码 agent 输出高质量上下文的执行层。"coding handoff" 是 V1 的一等公民，不是后续阶段的附加功能。

### V1 成功标准

用户在以下场景中能真正完成事：

1. 在 Project 页面：
   - 让 AI 帮我整理 brief、创建 issue、创建 workflow、创建 doc。

2. 在 Workflow Run 页面：
   - 让 AI 帮我推进步骤、标记阻塞、发起 review、接受 handoff、提交 record。

3. 在 Doc 页面：
   - 让 AI 读取文档内容和关联对象，整理后续 action，并提交 doc revision。

4. 在 Issue 页面：
   - 让 AI 添加评论、取消 issue、补充执行说明。
   - 让 AI 基于 issue + 关联 doc + brief 生成一段可直接交给 Claude Code / Codex 的编码 prompt，并把这段 prompt 落到 issue 上。

---

## V1 非目标

以下内容明确不在当前阶段：

1. 不做 multi-agent planner / worker / reviewer 架构。
2. 不做自主长期运行 agent。
3. 不做浏览器自动化、终端自动化、文件系统代理。
4. 不接入高管理权限动作。
5. 不做产品中心化的 `/ai` 模块。
6. 不把 AI 做成另一个团队聊天系统。

---

## 核心交互链路

V1 的完整链路应该是：

`User message -> Read context -> Decide next action -> Preview / Confirm if needed -> Execute -> Continue`

### 详细步骤

1. 用户发消息。
2. 前端把当前页面上下文一起带给 agent runtime。
3. agent runtime 先读 thread 历史。
4. agent runtime 调用 read tools 补足真实上下文。
5. 模型决定：
   - 继续问问题
   - 给建议
   - 发起一个具体动作
6. 如果是写动作：
   - `AUTO`：直接执行
   - `CONFIRM`：先 `dryRun`
7. 前端显示 tool result 或确认卡。
8. 用户确认后，run 恢复。
9. agent 继续执行后续步骤或给出结果总结。

### 必须坚持的规则

1. 先读，后写。
2. 没拿到真实对象 ID 时，不得直接猜写。
3. `CONFIRM` 动作不允许直接执行。
4. 一次 run 最多执行有限步数。
5. 每次执行后都要把 tool trace 和结果写入线程历史。

---

## 前后端职责边界

## Frontend UI

负责：

1. AI thread 列表与详情页。
2. 消息流渲染。
3. tool call / tool result / approval card 渲染。
4. 当前页面上下文注入。
5. 用户确认 / 拒绝操作。

不负责：

1. 调模型。
2. 直接写业务对象。
3. 保存权威线程状态。

## Next.js Agent Runtime

负责：

1. 调用模型。
2. 维护 tool loop。
3. 管理流式返回。
4. 调用 read tools。
5. 调用 execute tools。
6. 处理 `dryRun -> confirm -> resume`。

不负责：

1. 直接操作数据库。
2. 直接成为业务 authority。

### 硬约束

1. Next runtime 不得直接读写 Prisma / Supabase 表。
2. Next runtime 不得在本地复刻业务校验逻辑（例如 issue 状态机、workflow 转移规则）。所有业务判断必须通过 Nest HTTP 接口完成。
3. Next runtime 里的 tool 实现必须是"调用一个 Nest 接口、把结果原样塞回 model"的薄层包装，禁止本地 if/else 业务分支。
4. Next runtime 唯一允许写入的本地存储只有：LLM provider 的临时 streaming 状态、AI SDK 的 message buffer。其他状态必须落到 Nest 持久化。

破坏这些约束的 PR 必须被拒。这条规则要写进 `apps/frontend/AGENTS.md`。

## Nest Backend

负责：

1. 线程持久化 API。
2. AI context 读取 API。
3. 已有 `ai-execution` 写动作 API。
4. 审计与权限校验。

---

## 为什么“读工具”比“写工具”更重要

如果没有读工具，AI 就只能从用户话里猜：

1. 当前 issue 是哪个
2. 当前 workflow run 卡在哪一步
3. 当前用户是否有权限
4. 文档关联的是哪个项目

这会让执行层非常脆弱。

所以 V1 的 agent 不应该把 `ai-execution` 当作唯一能力，而应该有两组工具：

1. `read tools`
2. `execute tools`

---

## 工具分层设计

## A. Read Tools

这些工具不改状态，只给模型真实上下文。

### V1 必做

1. `get_current_surface_context`
   - 读取当前页面对象摘要（**深度读**）。
   - 输入：`surfaceType`, `surfaceId`, `workspaceId`
   - 注意：用户消息进入 runtime 时已经自动注入了一份**浓缩 surface 摘要**（2-5 行：对象类型、title、status、owner、最近动作），模型只在需要更深细节时才调用这个工具。详见后文「上下文注入策略」。

2. `get_workspace_summary`
   - 读取当前工作空间下最近的协作对象摘要。

3. `get_project_detail`
   - 输入：`projectId`

4. `get_issue_detail`
   - 输入：`issueId`

5. `get_workflow_run_detail`
   - 输入：`issueId`
   - 这里 workflow run 本质上还是 issue。

6. `get_doc_detail`
   - 输入：`docId`

7. `search_docs`
   - 输入：`query`, `workspaceId`

8. `get_ai_capabilities`
   - 读取当前用户在当前 workspace 下有哪些可执行动作。

9. `assemble_coding_prompt`
   - 输入：`issueId`
   - 聚合 issue 主体 + 关联 doc / brief + workflow 上下文 + 受影响模块说明，输出一段可直接粘进 Claude Code / Codex 的结构化 prompt。
   - 这是 Synaply → 外部编码 agent 的桥梁工具，V1 必须有。

### V1.5 可以补

1. `list_recent_projects`
2. `list_recent_issues`
3. `get_project_related_docs`
4. `get_issue_comments`
5. `get_project_activity_summary`

## B. Execute Tools

这些工具本质上是对现有 `ai-execution` 的 typed wrapper。

注意：

`模型不应该直接使用一个通用 execute_action(actionKey, payload)`

而应该给模型单独暴露清晰工具名，例如：

1. `create_project`
2. `update_project`
3. `create_issue`
4. `cancel_issue`
5. `advance_workflow_run`
6. `request_workflow_review`
7. `submit_workflow_record`
8. `create_doc_revision`
9. `create_comment`

每个工具内部再调用后端通用执行接口。

此外 V1 必须包含：

10. `attach_coding_prompt_to_issue`
    - 输入：`issueId`, `prompt`
    - 把 `assemble_coding_prompt` 产出的 prompt 落到 issue 的 `aiHandoffPrompt` 字段，前端在 issue 详情页给一个"复制给 Claude Code"的按钮。
    - 这条动作走 `CONFIRM` 还是 `AUTO`？建议 `AUTO`：写入的是辅助字段，不改 issue 状态。

这样更容易：

1. 降低 hallucination
2. 做参数校验
3. 管控审批语义
4. 做更好的工具描述

### Tool 定义的单一源原则

`execute tools` 不允许在 Next 和 Nest 两边手写两份 schema。流程是：

1. Nest `ai-execution` 维护一份机器可读的 capability manifest（JSON Schema）。
2. Next runtime 启动时通过 `GET /ai-execution/capabilities` 拉取 manifest，动态生成 AI SDK 的 tool 定义（参数 schema、描述、审批模式都来自 manifest）。
3. Next runtime 本地只负责为每个工具补充**面向模型的描述文案**（中英文 prompt 片段），不重复写 zod schema。
4. 新增一个 ai-execution action 时，只改 Nest 一处。

### Tool 抽象的协议无关性

V1 不做 MCP，但 tool 抽象必须设计成协议无关：

1. Nest `ai-execution` 的 capability manifest + 执行端点是真正的 source of truth。
2. 现阶段只暴露 HTTP 给 Next runtime。
3. 未来可以在 Nest 上加一层 MCP server adapter，把同一组 tools 暴露给本地的 Claude Code / Codex，让外部编码 agent 也能直接读 Synaply 上下文、提交 workflow record。
4. 这意味着 tool 名称、参数、语义必须是"协议无关命名"，不要带 `http_` / `nest_` 前缀。

---

## 确认机制设计

`CONFIRM` 动作是整个 agent 架构里最重要的部分之一。

### 原则

1. 模型可以提出动作。
2. 模型不能绕过确认。
3. 用户确认之前，只能 `dryRun`。
4. 确认后必须可恢复同一个 run。

### 流程

1. 模型决定调用一个 `CONFIRM` 动作。
2. runtime 先发 `dryRun: true` 到后端。
3. 后端返回 preview、summary、executionId。
4. runtime 记录 `pending approval`。
5. 前端渲染确认卡。
6. 用户点确认。
7. 前端请求 `confirm approval`。
8. runtime 再调用后端 `confirmed: true`。
9. 执行成功后，继续让模型决定下一步。

### UI 上必须能展示

1. 动作名称
2. 目标对象
3. 结构化 payload
4. 审批模式
5. 风险提示
6. 执行结果

---

## 线程与运行的数据模型

V1 建议新增下面四组核心对象。

## 1. AI Thread

表示一个持续的 AI 协作线程。

建议字段：

1. `id`
2. `workspaceId`
3. `creatorUserId`
4. `title`
5. `status`
6. `originSurfaceType`（线程创建时所在的页面类型，仅用于追溯）
7. `originSurfaceId`
8. `createdAt`
9. `updatedAt`
10. `lastMessageAt`

### `originSurfaceType` 建议值

1. `workspace`
2. `project`
3. `issue`
4. `workflow`
5. `doc`

### 为什么不只用一个 surface

真实对话经常同时引用多个对象（"根据这份 doc 给这个 project 建几个 issue"）。线程只记录"出生 surface"，运行期可以 pin 多个上下文对象，详见 `AI Thread Context Pin`。

## 1.5 AI Thread Context Pin

表示线程当前关注的对象集合。一条线程可以同时 pin 多个对象。

建议字段：

1. `id`
2. `threadId`
3. `surfaceType`
4. `surfaceId`
5. `pinnedAt`
6. `pinnedByUserId`（人工 pin 还是 AI 自动 pin）
7. `source`：`origin` / `user` / `agent`

## 2. AI Message

消息必须支持富结构，不只是文本。

建议字段：

1. `id`
2. `threadId`
3. `role`
4. `parts`
5. `createdAt`

### `role` 建议值

1. `user`
2. `assistant`
3. `tool`
4. `system`

### `parts` 建议结构

支持：

1. text part
2. tool-call part
3. tool-result part
4. approval-request part
5. error part
6. context-chip part

## 3. AI Run

一条用户消息触发的一次 agent 执行过程。

建议字段：

1. `id`
2. `threadId`
3. `status`
4. `model`
5. `stepCount`
6. `maxSteps`（默认 10）
7. `tokenBudget`（默认 60000）
8. `tokensUsed`
9. `startedAt`
10. `finishedAt`
11. `lastError`
12. `pendingApprovalId`

## 3.5 AI Run Step

一次 LLM 调用 + 它产生的 tool calls 的执行追踪。每个 run 会有多个 step。

建议字段：

1. `id`
2. `runId`
3. `stepIndex`
4. `kind`：`llm_call` / `tool_call`
5. `model`（仅 llm_call）
6. `promptSnapshot`（截断到合理大小）
7. `responseSnapshot`
8. `toolName`（仅 tool_call）
9. `toolInput`
10. `toolOutput`
11. `tokensIn` / `tokensOut`
12. `latencyMs`
13. `error`
14. `createdAt`

这张表是 V1 必须有的，否则线上 debug 完全瞎。可以做按 30 天 TTL 自动清理。

### `status` 建议值

1. `running`
2. `waiting_approval`
3. `completed`
4. `failed`
5. `cancelled`

## 4. Pending Approval

表示一次等待用户确认的动作。

建议字段：

1. `id`
2. `threadId`
3. `runId`
4. `actionKey`
5. `summary`
6. `input`
7. `previewResult`
8. `status`
9. `createdAt`
10. `resolvedAt`
11. `resolvedByUserId`

### `status` 建议值

1. `pending`
2. `confirmed`
3. `rejected`
4. `expired`

### Approval TTL

`pending` 状态的 approval 有 24 小时 TTL：超时自动迁移到 `expired`，对应的 run 标记为 `cancelled` 并在 thread 里写一条 system message 说明原因。后端用一个定时 job（cron 或 listener）做这件事。

---

## 目录建议

## 前端 `apps/frontend`

建议新增：

```text
src/app/api/ai/threads/route.ts
src/app/api/ai/threads/[threadId]/messages/route.ts
src/app/api/ai/threads/[threadId]/approvals/[approvalId]/confirm/route.ts
src/app/api/ai/threads/[threadId]/approvals/[approvalId]/reject/route.ts

src/components/ai/thread/AiThreadShell.tsx
src/components/ai/thread/AiMessageList.tsx
src/components/ai/thread/AiComposer.tsx
src/components/ai/thread/AiApprovalCard.tsx
src/components/ai/thread/AiToolResultCard.tsx

src/hooks/useAiThread.ts
src/hooks/useAiThreadStream.ts

src/stores/ai-thread.ts

src/lib/ai/agent.ts
src/lib/ai/models.ts
src/lib/ai/types.ts
src/lib/ai/runtime/context.ts
src/lib/ai/runtime/system-prompt.ts
src/lib/ai/tools/read/*.ts
src/lib/ai/tools/execute/*.ts
src/lib/ai/backend/*.ts
```

### 关键规则

1. `src/stores/chat.ts` 不要直接承载 AI thread。
2. 现有 `/chat` UI 可以借布局，但 AI domain model 要独立。
3. `src/app/api/ai/*` 是 runtime 层，不写业务判断。

## 后端 `apps/backend`

建议新增：

```text
src/ai-thread/*
src/ai-context/*
```

### `ai-thread`

负责：

1. 创建线程
2. 保存消息
3. 保存 run
4. 保存 pending approval
5. 提供线程读取接口

### `ai-context`

负责：

1. 当前 surface 上下文
2. project / issue / workflow run / doc 读取
3. docs 搜索
4. capabilities 读取聚合

### 已有模块继续负责

1. `ai-execution`：写动作 authority
2. `project / issue / workflow / doc`：真实业务逻辑

---

## API 分层建议

## A. 前端对 Next Runtime 的接口

这些接口只给浏览器用。

### 1. 创建线程

`POST /api/ai/threads`

### 2. 获取线程

`GET /api/ai/threads/:threadId`

### 3. 发消息并启动 run

`POST /api/ai/threads/:threadId/messages`

返回 streaming response。

### 4. 确认待审批动作

`POST /api/ai/threads/:threadId/approvals/:approvalId/confirm`

### 5. 拒绝待审批动作

`POST /api/ai/threads/:threadId/approvals/:approvalId/reject`

## B. Next Runtime 对 Nest Backend 的接口

这些接口是内部 BFF 调用。

### 线程相关

1. `POST /workspaces/:workspaceId/ai-threads`
2. `GET /workspaces/:workspaceId/ai-threads/:threadId`
3. `POST /workspaces/:workspaceId/ai-threads/:threadId/messages`
4. `POST /workspaces/:workspaceId/ai-runs`
5. `POST /workspaces/:workspaceId/ai-approvals`

### 上下文读取

1. `GET /workspaces/:workspaceId/ai-context/surface`
2. `GET /workspaces/:workspaceId/ai-context/projects/:id`
3. `GET /workspaces/:workspaceId/ai-context/issues/:id`
4. `GET /workspaces/:workspaceId/ai-context/workflow-runs/:id`
5. `GET /workspaces/:workspaceId/ai-context/docs/:id`
6. `GET /workspaces/:workspaceId/ai-context/docs/search`

### 执行动作

继续复用：

1. `GET /workspaces/:workspaceId/ai-execution/capabilities`
2. `POST /workspaces/:workspaceId/ai-execution/actions/:actionKey/execute`

---

## 鉴权建议

V1 采取最简单可靠的方式：

1. 浏览器从现有 `AuthContext` 获取 Supabase access token。
2. 浏览器请求 Next `app/api/ai/*` 时，把 token 带上。
3. Next runtime 调 Nest 的 read / execute API 时，原样透传 Bearer token。

这样可以保证：

1. AI 的读取权限与用户一致。
2. AI 的执行权限与用户一致。
3. 不需要在浏览器中暴露 provider secret。

---

## 模型与 SDK 建议

## V1 依赖建议

前端建议新增：

1. `ai`（Vercel AI SDK）
2. `zod`
3. `@ai-sdk/anthropic`

## V1 默认模型

V1 上线必须有一个明确的默认模型，否则 system prompt、tool 描述、token budget 都没法调。

- 默认：`claude-sonnet-4-6`
- 复杂协调（场景 3 那种多步动作）可以临时切到 `claude-opus-4-6`
- 代码层保持 provider 接口可替换，但 prompt tuning 只针对默认模型做。
- 第三方模型（OpenAI / Gemini）开放切换是 V1.5 之后的事。

## V1 Agent 形态

采用：

1. `single ToolLoopAgent`
2. 有限 step count（默认 10）
3. typed tools
4. 可中断确认
5. 每个 run 强制 token budget（默认 60k），超额直接 `failed`
6. 每个 LLM 调用、tool 调用都写 `ai_run_step` 追踪

不采用：

1. planner agent
2. worker agent
3. critic agent
4. 自动 handoff between agents

---

## 上下文注入策略

避免每次都通过 `get_current_surface_context` 拉一大段 doc 进上下文。两层策略：

### 1. 每条 user message 自动注入"浓缩 surface 摘要"

runtime 在调用模型前，会按 thread 的 origin surface 和当前 pin 列表，对每个 pinned 对象生成一段 2-5 行的摘要：

- 对象类型 + ID
- title
- status / phase
- owner / 当前接手人
- 最近一次重要动作（review requested / handoff accepted / blocked …）

这段摘要塞进 system prompt 的尾部或单独一条 system message。**它的目标是让 model 在不调用任何工具的情况下，就知道"我们在讨论的是哪几个对象"**。

### 2. 深度信息按需通过 read tool 拉

完整 brief、所有 comments、所有 workflow records、整篇 doc 这些只在模型主动调用 read tool 时才进上下文。

### 摘要尺寸约束

- 每个 pinned 对象的摘要不超过 500 tokens。
- 一个 thread 同时 pin 的对象不超过 5 个。
- 摘要由 Nest 的 `ai-context` 模块生成，Next runtime 不做摘要。

## System Prompt 的最小规则

V1 不需要复杂 prompt engineering，但必须有稳定规则。

至少包含：

1. 你在 Synaply 中工作，必须基于真实系统对象行动。
2. 在没有确认对象 ID 前，不得执行写动作。
3. 当任务依赖真实状态时，优先读取上下文而不是猜测。
4. `CONFIRM` 动作必须先预演，再等待用户确认。
5. 优先推进真实协作链路，不输出脱离对象的空泛建议。
6. 工具执行成功后，要总结结果并提出下一步。

---

## Phase 拆分

## Phase 0 — 架构骨架

目标：

把 thread、run、runtime 的基础骨架搭起来。

### 前端

1. 安装 AI SDK 与基础依赖。
2. 建立 `src/lib/ai/*` 与 `src/app/api/ai/*` 骨架。
3. 建立 AI thread 的独立 store 和 UI types。
4. 做最小的线程页面与消息列表。

### 后端

1. 新增 `ai_thread / ai_thread_context_pin / ai_message / ai_run / ai_run_step / ai_pending_approval` 数据表与 Prisma schema。
2. 所有 ai_* 表的 workspace 隔离按现有约定走应用层：service 方法首行调用 `TeamMemberService.validateWorkspaceAccess(userId, workspaceId)`，与 `inbox` / `ai-execution` 同口径（项目并未启用 Postgres RLS，service role 直连 + 应用层校验是现有标准）。
3. 新增 `ai-thread` NestJS module，提供线程 CRUD 接口。
4. 新增 approval TTL 定时清理逻辑（cron 或 listener，24h）。
5. `ai-execution` 增加 capability manifest 输出端点（machine readable），作为 Next runtime 的 tool 定义来源。

### 验收

1. 可以创建线程。
2. 可以写入和读取消息。
3. 可以流式返回一条 assistant 文本消息。
4. `GET /ai-execution/capabilities` 返回带 JSON Schema 的 manifest。
5. 工作空间隔离验证：跨 workspace 的用户互相看不到对方的 thread（应用层校验）。

## Phase 1 — Read-only Agent

目标：

先让 AI 真正“知道自己在看什么”，但还不写业务对象。

### 前端

1. runtime 能读取当前 surface context。
2. 支持 tool result 渲染。
3. 支持线程级 streaming。

### 后端

1. 新增 `ai-context` 只读接口。
2. 接好 `get_current_surface_context` 等 read tools 所需数据。

### 验收

1. 在 Project / Issue / Workflow Run / Doc 页面打开 AI 线程。
2. AI 能准确说明当前对象状态。
3. AI 能引用真实 project / issue / workflow / doc 信息。

## Phase 2 — Execution Agent

目标：

把已有 `ai-execution` 真正接进前端 agent。

### 前端

1. 每个写动作做 typed wrapper。
2. tool result 卡片可展示执行结果。
3. approval card 支持 confirm / reject。
4. 确认后 run 可恢复。

### 后端

1. 复用已有 `ai-execution`。
2. 把 approval persistence 接上线程系统。

### 验收

1. 用户说“帮我为这个 workflow run 发起 review”。
2. AI 先读取当前 run。
3. AI 生成 payload。
4. UI 展示确认卡。
5. 用户确认后，真实动作成功执行。
6. AI 继续总结结果并提示下一步。

## Phase 3 — 协作增强

目标：

让 agent 不只是执行一个动作，而是能持续推进协作。

### 内容

1. 追加更多 read tools。
2. 让 AI 自动补齐关联 doc / issue / comment。
3. 在 thread 中展示更清晰的“已完成动作列表”。
4. 优化 current surface context 注入。

### 验收

1. 一次对话里可以连续完成多步协作动作。
2. 用户能清楚看到 AI 已做了什么、接下来建议做什么。

## Phase 4 — 背景能力

这一阶段先不做，但后续可以接：

1. digest
2. project risk scan
3. team pulse
4. async suggestions

---

## 第一批任务清单

下面这组任务就是“现在可以开工”的顺序。

### 第 1 组：线程基础设施

1. 后端新增 `ai_thread / ai_thread_context_pin / ai_message / ai_run / ai_run_step / ai_pending_approval` schema。
2. ai_* service 方法统一通过 `TeamMemberService.validateWorkspaceAccess` 做 workspace 隔离（与 inbox / ai-execution 同口径）。
3. 后端新增 `ai-thread` module 与 API。
4. 后端新增 approval TTL 清理逻辑。
5. 后端给 `ai-execution` 加 capability manifest 输出端点。
6. 前端新增 AI thread store。
7. 前端新增基础 thread UI。

### 第 2 组：Next Runtime

1. 安装 AI SDK。
2. 新增 `app/api/ai/threads/:threadId/messages/route.ts`。
3. 跑通一次最小 streaming assistant。
4. 把用户 token 从浏览器透传到 runtime。

### 第 3 组：Read Tools

1. 定义 `src/lib/ai/tools/read/*`。
2. 后端补 `ai-context` 接口。
3. 后端实现"浓缩 surface 摘要"生成器（每个对象 ≤500 tokens）。
4. Next runtime 在每条 user message 之前自动注入摘要。
5. 跑通 `get_current_surface_context` 深度读。
6. 跑通 `get_issue_detail / get_workflow_run_detail / get_doc_detail`。

### 第 4 组：Execution Tools

1. Next runtime 启动时拉 capability manifest，**动态生成** typed tool 定义；不手写 zod schema。
2. 本地只为每个工具补一段面向模型的中文描述文案。
3. 先接最常用的一批：
   - `create_issue`
   - `cancel_issue`
   - `advance_workflow_run`
   - `block_workflow_run`
   - `request_workflow_review`
   - `respond_workflow_review`
   - `request_workflow_handoff`
   - `accept_workflow_handoff`
   - `submit_workflow_record`
   - `create_doc_revision`
   - `create_comment`

### 第 4.5 组：Coding Handoff（V1 必做）

1. 后端 issue 模型加一个 `aiHandoffPrompt` 字段（text，nullable）。
2. 后端 `ai-context` 加 `assemble_coding_prompt` 端点：聚合 issue + 关联 doc + workflow + project brief，按固定模板输出 prompt 文本。
3. `ai-execution` 加 `attach_coding_prompt_to_issue` 动作（AUTO 模式，写 `aiHandoffPrompt`）。
4. 前端 issue 详情页加"复制给 Claude Code"按钮，展示并允许复制 `aiHandoffPrompt`。
5. AI thread 中支持 `coding-prompt` 类型的 message part，独立渲染（不要和普通 assistant 文本混在一起）。

### 第 5 组：确认与恢复

1. 建立 pending approval persistence。
2. 做确认卡 UI。
3. 做 confirm / reject 接口。
4. 跑通 `dryRun -> confirm -> execute -> continue`。

---

## 最先验证的三个真实场景

## 场景 1：Workflow Run 推进

用户在 workflow run 页面说：

`帮我看看这个流程卡在哪里，如果可以的话推进到下一步。`

期望：

1. AI 读取当前 run。
2. 识别当前步骤状态。
3. 如果可推进，则调用 `advance_workflow_run`。
4. 返回结果总结。

## 场景 2：Review / Handoff

用户说：

`帮我让设计负责人 review 一下这个步骤。`

期望：

1. AI 识别当前对象和目标人。
2. 若信息不足，先追问。
3. 生成 review payload。
4. 走确认。
5. 执行后继续说明下一步。

## 场景 3：Doc -> Action

用户在 doc 页面说：

`根据这份纪要，帮我补一个后续 issue，并在文档里留个修订说明。`

期望：

1. AI 读取 doc。
2. 抽取后续 action。
3. 创建 issue。
4. 提交 doc revision。
5. 总结已落地对象。

---

## 实施时必须避免的坑

1. 不要直接把 team chat 的 store 和 message model 改造成 AI。
2. 不要只做写工具，不做读工具。
3. 不要把通用 `actionKey + payload` 直接暴露给模型。
4. 不要在浏览器里直接调模型。
5. 不要跳过 `CONFIRM` 的中断与恢复。
6. 不要让 thread 只存在于本地状态里。
7. 不要在没有真实对象上下文的情况下强行执行动作。

---

## 当前架构决策

截至这份文档，明确的技术决策如下：

1. `ai-execution` 继续作为后端写动作 authority，并新增 capability manifest 输出。
2. 新增 `ai-thread` 与 `ai-context` 作为 backend support layer。
3. Next.js `app/api/ai/*` 作为 agent runtime，**严格限定**为模型调用 + tool loop + streaming + token 透传，不写任何业务判断。
4. Tool schema 单一源：Nest manifest 是真相，Next runtime 动态生成 tool 定义。
5. Tool 抽象协议无关：未来可在 Nest 上加 MCP adapter，让外部 Claude Code / Codex 直接消费同一组 tools。
6. 前端 AI thread 与现有 `/chat` 数据模型分离。
7. AI thread 支持多对象 pin（`AI Thread Context Pin`），不限制单一 surface。
8. V1 使用 `single agent + tool loop + confirmation`。
9. V1 默认模型 `claude-sonnet-4-6`。
10. V1 必须包含 `assemble_coding_prompt` + `attach_coding_prompt_to_issue` 这条"交给外部编码 agent"的链路。
11. 所有 ai_* service 入口通过 `TeamMemberService.validateWorkspaceAccess` 做 workspace 隔离（沿用现有约定，不引入 Postgres RLS）。
12. 每个 run 强制 step / token / TTL 上限，每次 LLM/tool 调用写 `ai_run_step` 追踪。
13. V1 先做产品内 agent，不做 CLI 式代理能力。

---

## 一句话版下一步

接下来不要再讨论“AI 能不能做很多事”，而是按下面顺序开工：

1. 先把 `AI Thread + Run + Approval` 的基础数据层搭起来。
2. 再把 `Next Runtime + Streaming` 跑通。
3. 再补 `read tools`。
4. 最后把现有 `ai-execution` 包成 typed execution tools 接进去。

只有这样，Synaply 的 AI 才会从“会聊天”变成“能推进真实协作对象”。
