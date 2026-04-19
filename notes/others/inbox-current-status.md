# Inbox 当前实现说明

更新时间: 2026-04-10

关联提交:
- Frontend: `2ca201e` `feat(inbox): add triage inbox surface`
- Backend: `a27f02f` `feat(inbox): add inbox projection and APIs`

## 1. 目标与当前定位

Inbox 目前的定位不是“另一个消息系统”，而是 Synaply 核心协作链路里面向个人的 `Personal Pulse`。

它的职责是:

- 把 Projects、Issues、Workflows 的高价值状态变化转成可处理的个人信号
- 让用户快速完成 triage: 看一眼、决定是否现在处理、稍后处理、或者清掉提醒
- 给 `My Work` 和后续 digest / realtime / cross-tool notification 打基础

当前版本已经完成一个可用的 P0:

- 有独立持久化模型
- 有独立后端 API
- 有前端 Inbox 页面与交互
- 有与 My Work / realtime invalidation 的联动

但它还不是最终形态，仍属于“可用的第一版 inbox 基础设施”。

## 2. 当前已实现的功能

### 2.1 数据持久化与模型

后端新增了 `InboxItem` 模型，用来保存用户态提醒，而不是只在前端临时拼装。

关键文件:

- `/Users/luke/Synaply/apps/backend/prisma/schema.prisma`
- `/Users/luke/Synaply/apps/backend/prisma/migrations/20260410110000_add_inbox_module/migration.sql`

当前 `InboxItem` 主要承载:

- signal 类型
- bucket 分类
- source 类型与 source id
- 关联的 project / issue / workflow
- title / summary / priority / actionLabel
- status
- dedupeKey
- occurredAt
- metadata
- readAt / doneAt / dismissedAt / snoozedUntil

这使 Inbox 可以稳定保存这些用户态:

- `unread`
- `seen`
- `done`
- `dismissed`
- `snoozed`

### 2.2 当前支持的信号类型

当前 P0 已经接入 6 类真实 signal:

1. `workflow.review.requested`
2. `workflow.handoff.requested`
3. `workflow.blocked`
4. `issue.assigned`
5. `project.risk.flagged`
6. `deadline.soon`

类型定义在:

- `/Users/luke/Synaply/apps/backend/src/inbox/inbox.types.ts`
- `/Users/luke/Synaply/apps/frontend/src/lib/fetchers/inbox.ts`

### 2.3 当前支持的 bucket 与状态

逻辑 bucket:

- `needs-response`
- `needs-attention`
- `following`
- `digest`

前端视图层对应为:

- `Primary`
- `Other`
- `Later`
- `Cleared`

其中:

- `Primary` 主要承接需要立即 triage 的项
- `Other` 承接 attention / following
- `Later` 展示 snoozed 项
- `Cleared` 展示 done 项

### 2.4 后端同步与投影逻辑

当前 Inbox 采用的是“请求时同步投影”模型，不是异步消息总线。

核心流程:

1. 用户请求 Inbox feed / summary
2. `InboxService` 扫描当前用户相关的 issue / project
3. 根据业务状态生成 signal draft
4. 用 `dedupeKey` 将 signal upsert 到 `inbox_items`
5. 将已经不再成立的旧 signal 自动收口为 `done`
6. 返回当前用户的 feed / summary

关键文件:

- `/Users/luke/Synaply/apps/backend/src/inbox/inbox.service.ts`

关键方法:

- `collectSignalsForUser`
- `syncUserInboxState`
- `getInbox`
- `getInboxSummary`

### 2.5 当前支持的后端 API

当前已提供的 Inbox API:

- `GET /workspaces/:workspaceId/inbox`
- `GET /workspaces/:workspaceId/inbox/summary`
- `POST /workspaces/:workspaceId/inbox/:itemId/seen`
- `POST /workspaces/:workspaceId/inbox/:itemId/unread`
- `POST /workspaces/:workspaceId/inbox/:itemId/done`
- `POST /workspaces/:workspaceId/inbox/:itemId/dismiss`
- `POST /workspaces/:workspaceId/inbox/:itemId/snooze`
- `POST /workspaces/:workspaceId/inbox/clear`

对应文件:

- `/Users/luke/Synaply/apps/backend/src/inbox/inbox.controller.ts`

### 2.6 当前支持的前端页面与交互

Inbox 页面入口:

- `/Users/luke/Synaply/apps/frontend/src/app/[locale]/(main)/inbox/page.tsx`

主要实现:

- `/Users/luke/Synaply/apps/frontend/src/components/inbox/InboxPageContent.tsx`
- `/Users/luke/Synaply/apps/frontend/src/hooks/useInbox.ts`
- `/Users/luke/Synaply/apps/frontend/src/lib/fetchers/inbox.ts`

当前页面能力包括:

- ClickUp 风格的 triage inbox 布局
- `Primary / Other / Later / Cleared` 视图
- 按时间分组展示
- 过滤 `Unread / Actionable`
- `Refresh`
- `Clear all`
- 单条 item 的 `Read / Unread`
- 单条 item 的 `Later`
- 单条 item 的 `Clear`
- workflow handoff 的 `Accept`
- 点击整行打开真实上下文

### 2.7 当前设计与视觉状态

当前前端已经做完以下设计调整:

- 从 dashboard 式首页切换为 list-first inbox
- item 采用更像 triage queue 的高密度行式结构
- dark mode 已调整为黑灰体系，而非蓝黑体系
- item hover / unread 状态支持圆角矩形块式高亮
- Inbox 入口已重新接回主导航

导航源文件:

- `/Users/luke/Synaply/apps/frontend/src/lib/data/constant.ts`

### 2.8 与 My Work 的联动

`My Work` 当前已经接入 `inboxSignals` 摘要投影。

对应文件:

- `/Users/luke/Synaply/apps/backend/src/workspace/workspace.service.ts`
- `/Users/luke/Synaply/apps/frontend/src/lib/fetchers/my-work.ts`

这意味着 Inbox 不再是孤立页面，而是已经开始反向影响个人工作台。

### 2.9 当前的“近实时”能力

当前不是后端主动 push 一条 Inbox item，而是:

1. issue / workflow / project 变更后触发 workspace realtime
2. 前端收到 broadcast 后失效:
   - `["inbox"]`
   - `["inbox-summary"]`
   - `["my-work"]`
3. React Query 重新拉取
4. 后端在拉取时完成 signal 同步
5. 页面出现新的 Inbox item

对应文件:

- `/Users/luke/Synaply/apps/frontend/src/hooks/realtime/useWorkspaceRealtime.ts`

所以当前能力是“realtime invalidate + refetch”，不是“真正写时推送”。

## 3. 当前已经实现但尚未充分使用的能力

这些能力后端已经有，但前端尚未完全展开使用:

### 3.1 `dismiss`

后端已经有 `dismiss` API，但当前主页面动作重点仍然是:

- `Read / Unread`
- `Later`
- `Clear`

`dismiss` 还没有作为主要前端动作暴露。

### 3.2 cursor / limit

后端 feed 已支持 `cursor` 与 `limit`，但当前前端仍以一次性取较多数据为主，并没有做完整 infinite scroll。

## 4. 当前未完成或明确待做的部分

### 4.1 真正的 async digest 还没有生产器

虽然类型里预留了 `digest.generated`，但当前并没有定时生成 digest 的 producer。

也就是说:

- 还没有 daily digest
- 还没有 weekly digest
- 还没有定时总结任务

### 4.2 真正的 realtime inbox 还没有打通

当前不是“上游一发生变化，后端立刻创建 InboxItem 并 push 给你”。

目前仍然是:

- 请求时同步
- 广播后重拉

如果目标是“issue 一切到你这里，你就立刻收到一条真正的 Inbox 消息”，下一步应升级为写时同步 projection。

### 4.3 actor 信息当前大多为空

虽然很多 workflow 相关状态在更上游是有活动来源的，但当前 Inbox projection 中 `actorUserId` 大部分还是 `null`。

这意味着当前文案更偏:

- “Review requested on X”
- “Handoff requested on X”

而不是:

- “Luke requested your review”

### 4.4 comment mention / doc signal 尚未接入

当前 source type 虽然包含 `doc`，但实际接入的 signal 还主要来自:

- issue
- workflow
- project

以下类型还没做完:

- `comment.mentioned`
- 决策相关 doc signal
- 文档 review / approval signal

### 4.5 目前没有完整的通知偏好系统

设置页已经留出未来承载位置，但当前还没有真正的用户偏好配置，例如:

- 哪些类型进 inbox
- 哪些类型进 digest
- 哪些需要跨工具通知
- snooze 默认时长

### 4.6 导航入口还没有未读 badge

入口已经恢复，但还没有把 summary 进一步挂成:

- 未读数字
- 小红点
- attention badge

### 4.7 还缺少更完整的测试覆盖

当前完成了 build 级验证，但还没有看到专门针对 Inbox 新能力补充的系统测试 / 端到端测试 / 更细的服务级测试。

## 5. 当前实现的核心原理

### 5.1 它不是通知系统本体，而是状态投影层

Inbox 当前最重要的原则是:

“上游对象产生业务状态，Inbox 负责把这些状态翻译成个人可处理的 signal。”

所以真正的业务源头是:

- `Issue`
- `Workflow run`
- `Project`

Inbox 自己不负责定义这些业务事实，它负责:

- 收集
- 去重
- 持久化
- 呈现
- 保存用户处理状态

### 5.2 `dedupeKey` 是核心稳定器

每一种 signal 都依赖 `dedupeKey` 来保证:

- 同一条提醒不会无限重复生成
- 状态变化时可以 reopen
- 上游条件消失时可以自动收口

### 5.3 stale signal 会自动收口

如果某条 signal 的上游条件已经不成立，例如:

- blocker 解除了
- review 状态结束了
- handoff 已经被接受了

那么同步逻辑会把旧提醒自动推进到 `done`，而不是永远留在 active feed 里。

### 5.4 snooze 是有恢复逻辑的

如果 item 处于 `snoozed` 状态，并且 `snoozedUntil` 到期，它会在同步时恢复到 active 状态。

## 6. 未来建议的演进顺序

### 第一阶段: 从“请求时同步”升级到“写时同步”

目标:

- 在 issue / workflow / project 的关键写入口中直接生成或更新 `InboxItem`
- 让 Inbox 从“请求时重建”变成“状态变更时写入”

收益:

- 真正的实时感
- 更容易做 badge、toast、全局提醒
- 更利于后续 digest 与外部通知

### 第二阶段: 建立真正的 `inbox.updated` 事件

目标:

- 后端在 InboxItem 变化后发出专门的 inbox 事件
- 前端收到后只更新 inbox 相关视图，而不是泛化地依赖 workspace invalidate

### 第三阶段: 补 actor-rich 文案

目标:

- 从 `issue_activity` 等业务来源提取 actor
- 让提醒文案更自然

示例:

- `Luke requested your review`
- `Momo handed this workflow step to you`
- `Tony marked this issue as blocked`

### 第四阶段: 补 comment / doc / decision 信号

这一步会让 Inbox 真正连起:

- Project
- Issue
- Workflow
- Doc

也更符合 Synaply 作为 collaboration OS 的定位。

### 第五阶段: 做 digest 和跨工具桥接

建议后续补:

- daily digest
- weekly digest
- Slack bridge
- 重要信号升级规则

但前提仍然是先把 Inbox 的核心 projection 和 realtime 走稳。

## 7. 当前版本的结论

当前 Inbox 已经不是占位页，而是具备真实业务价值的 P0:

- 能从业务对象中提取 signal
- 能稳定保存用户处理状态
- 有完整 feed 与 summary API
- 有前端 triage 体验
- 能与 My Work 和 realtime invalidation 联动

但它仍然不是终局版本。

当前最准确的定义是:

“一个已经可用的个人信号收件箱基础设施，完成了数据模型、投影、操作与页面落地；下一步重点应是写时同步、真正 realtime、actor-rich 文案、digest producer，以及 doc/comment 信号接入。”
