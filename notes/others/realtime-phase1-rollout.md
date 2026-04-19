# Realtime Phase 1 — Rollout & Smoke Test

## What changed

Phase 1 finishes wiring Supabase Realtime as the **authoritative** collaboration
broadcast layer. The database is now the single source of truth: writes flow
through Postgres triggers that call `realtime.send()`, and clients subscribe
through the existing Supabase channel infrastructure with RLS gating.

### Files

**Migration** — `supabase/migrations/20260410120000_realtime_semantic_inbox_project.sql`

1. Extends `can_access_realtime_topic()` with a `user:{userId}` topic kind,
   gated so only the user themselves can subscribe.
2. Upgrades `realtime_issue_activity_created_broadcast` to also re-emit
   `IssueActivity.metadata.eventType` (e.g. `workflow.review.requested`,
   `workflow.handoff.requested`, `workflow.blocked`) on `workflow_issue:{id}`
   and `workspace:{id}` topics whenever `metadata.kind = 'workflow'`.
3. New `realtime_inbox_item_broadcast` trigger on `inbox_items` emits
   `inbox.updated` on `user:{targetUserId}` for INSERT / DELETE and for any
   user-visible UPDATE. Idempotent updates are filtered out.
4. New `realtime_project_summary_broadcast` trigger on `projects` emits
   `project.summary.invalidated` on `workspace:{id}` for INSERT / DELETE
   and for changes to brief/status/risk_level/owner_member_id/phase/etc.

**Frontend events catalog** — `src/lib/realtime/events.ts`

- Added `INBOX_UPDATED`, `PROJECT_SUMMARY_INVALIDATED` event names.
- Added `InboxUpdatedPayload`, `ProjectSummaryInvalidatedPayload` types.
- Added `USER_REALTIME_EVENTS` array.
- `WORKSPACE_REALTIME_EVENTS` now includes `PROJECT_SUMMARY_INVALIDATED`.

**Frontend hooks**

- `src/lib/realtime/topics.ts` — added `buildUserTopic(userId)`.
- `src/hooks/realtime/useUserRealtime.ts` (new) — subscribes to
  `user:{userId}`, invalidates inbox/inbox-summary/my-work caches on
  `inbox.updated`.
- `src/hooks/realtime/useWorkspaceRealtime.ts` — folds `useUserRealtime`
  in, so every consumer of workspace realtime automatically gets per-user
  inbox push. Also invalidates `["projects", workspaceId]` on
  `PROJECT_SUMMARY_INVALIDATED`.

## Why DB triggers (not backend code)

The backend is on Supabase self-hosted, so the **most authoritative** pattern
is to call `realtime.send()` from inside the same Postgres transaction as
the write. Benefits:

- **Transactional** — write and broadcast cannot diverge; rollback covers both.
- **No service-role HTTP path** — backend never needs Supabase keys.
- **Survives any writer** — Prisma, raw SQL, future cron jobs, manual
  `psql` patches all broadcast equally.
- **Single source of truth** — collaboration semantics come from
  `IssueActivity.metadata.eventType`, which `issue.service.ts` already
  writes for every workflow action. Zero new backend code needed.

## Smoke test (two browsers, same workspace)

Open browser A and browser B as two different members of the same workspace,
each on `/tasks` (or `/inbox`).

### 1. Workflow review request

In A: open a workflow issue → click **请求 Review** → pick B as reviewer → submit.

Expected in B (within ~1s, no manual refresh):
- Inbox grows by 1 item in `Needs Response` bucket with title referencing
  the workflow review request.
- If B has the same workflow issue open: collaboration status card flips
  to "review pending", action buttons re-enable for B as reviewer.
- B's task list `Waiting For Me` count increments.

### 2. Handoff request

In A: open the workflow issue → **请求交接** → pick B as target → submit.

Expected in B:
- New inbox item `workflow.handoff.requested`, bucket `Needs Response`.
- "Accept handoff" button visible inline.
- After B clicks Accept: A's workflow detail flips current assignee to B
  in <1s.

### 3. Blocked

In A: **标记阻塞** with a reason.

Expected on every workspace member who has the project / workflow open:
- Project summary blocked-issue list grows by 1.
- Workflow node card shows blocked state with reason.
- Tasks page `Blocked` section grows by 1 for the assignee.

### 4. Project brief edit

In A: edit the project brief or change risk level.

Expected in B (project page open):
- Project header re-renders with new brief / risk badge.
- `["projects", workspaceId]` and `["project-summary", workspaceId]` both
  invalidate.

### 5. Inbox status changes are pushed back to the same user's other tabs

Open the same user in two tabs. In tab A: snooze an inbox item.

Expected in tab B:
- Snoozed item disappears from primary feed and shows up in `Later` within
  ~1s, no refresh.

## How to verify the migration applied

```sql
-- Functions exist
\df+ public.realtime_inbox_item_broadcast
\df+ public.realtime_project_summary_broadcast
\df+ public.can_access_realtime_topic

-- Triggers exist
select event_object_table, trigger_name
  from information_schema.triggers
 where trigger_name in (
   'realtime_inbox_item_broadcast',
   'realtime_project_summary_broadcast',
   'realtime_issue_activity_created_broadcast'
 );

-- Manual test: insert a fake workflow activity row with metadata
insert into public.issue_activities (id, issue_id, actor_id, action, metadata)
values (
  gen_random_uuid(), '<some_issue_id>', '<some_member_id>',
  'workflow.test',
  jsonb_build_object(
    'kind', 'workflow',
    'eventType', 'workflow.review.requested',
    'runStatus', 'WAITING_REVIEW',
    'currentStepId', 'step1',
    'nextStepId', 'step2'
  )
);
-- A subscriber on workflow_issue:<issue_id> should receive the event.
```

## Known limitations / follow-ups

### Cleanup (separate PR, post-verification)

The frontend currently still calls `broadcastIssueUpdated`,
`broadcastWorkflowRunEvent`, `broadcastIssueCreated`, etc. from
`useIssueApi.ts` and `useComment.ts` after every mutation. These are now
**duplicates** of what the DB triggers emit. They are harmless (same
payload, same topic) but waste a network round-trip and slightly increase
the chance of double-fired query invalidation.

Files to clean up after smoke test passes:

- `src/hooks/useIssueApi.ts` — remove broadcast calls at lines ~178, 256,
  313, 816, 870, 929, 986
- `src/hooks/useComment.ts` — remove broadcast call at line ~46
- `src/lib/realtime/broadcast.ts` — delete the file
- `src/api/index.ts`, etc. — drop any remaining imports

### Dead trigger to consider removing

`realtime_issue_workflow_broadcast` (created in the previous migration)
emits `workflow.node.status_changed`, `workflow.node.moved_next`,
`workflow.node.moved_previous`. These names are **not in `events.ts`** —
no client subscribes. After this migration, the equivalent semantic
events flow via `realtime_issue_activity_created_broadcast` from the
activity row metadata. The `_workflow_broadcast` function and trigger
can be dropped in a follow-up migration once we've confirmed nothing
external relies on it.

### Out of scope (Phase 2+)

- Promoting `pendingReviewerId` / `pendingHandoffTargetId` / `blockedReason`
  to first-class Issue columns (so subscribers don't need to read activity
  metadata to know who's responsible). Tracked as Phase 2 #4 in the
  prioritized plan.
- Extracting `WorkflowRunService` from `issue.service.ts`. Phase 2 #5.
- Visual `current step` highlight on the workflow ReactFlow graph. Phase 3 #6.

---

# Realtime Phase 1 - 发布与烟雾测试（中文版）

## 变更内容

Phase 1 完成了 Supabase Realtime 作为**权威协作广播层**的接入。现在数据库是单一事实来源：写入通过 Postgres trigger 调用 `realtime.send()` 发出事件，客户端继续通过现有的 Supabase channel 基础设施订阅，并由 RLS 做权限控制。

### 文件

**Migration** - `supabase/migrations/20260410120000_realtime_semantic_inbox_project.sql`

1. 扩展 `can_access_realtime_topic()`，新增 `user:{userId}` topic 类型，并限制只有用户本人可以订阅。
2. 升级 `realtime_issue_activity_created_broadcast`：当 `IssueActivity.metadata.kind = 'workflow'` 时，会把 `metadata.eventType`（例如 `workflow.review.requested`、`workflow.handoff.requested`、`workflow.blocked`）作为事件名，重新广播到 `workflow_issue:{id}` 和 `workspace:{id}` topic。
3. 新增 `inbox_items` 上的 `realtime_inbox_item_broadcast` trigger：对 INSERT / DELETE，以及任何用户可见字段发生变化的 UPDATE，在 `user:{targetUserId}` 上发出 `inbox.updated`。无意义的幂等 UPDATE 会被过滤掉。
4. 新增 `projects` 上的 `realtime_project_summary_broadcast` trigger：对 INSERT / DELETE，以及 brief/status/risk_level/owner_member_id/phase 等字段变化，在 `workspace:{id}` 上发出 `project.summary.invalidated`。

**前端事件目录** - `src/lib/realtime/events.ts`

- 新增 `INBOX_UPDATED`、`PROJECT_SUMMARY_INVALIDATED` 事件名。
- 新增 `InboxUpdatedPayload`、`ProjectSummaryInvalidatedPayload` 类型。
- 新增 `USER_REALTIME_EVENTS` 数组。
- `WORKSPACE_REALTIME_EVENTS` 现在包含 `PROJECT_SUMMARY_INVALIDATED`。

**前端 hooks**

- `src/lib/realtime/topics.ts` - 新增 `buildUserTopic(userId)`。
- `src/hooks/realtime/useUserRealtime.ts`（新增）- 订阅 `user:{userId}`，收到 `inbox.updated` 后失效 inbox / inbox-summary / my-work 缓存。
- `src/hooks/realtime/useWorkspaceRealtime.ts` - 内部接入 `useUserRealtime`，所以所有使用 workspace realtime 的页面都会自动获得当前用户的 inbox push。同时在收到 `PROJECT_SUMMARY_INVALIDATED` 时失效 `["projects", workspaceId]`。

## 为什么用 DB trigger，而不是后端代码

后端运行在 Supabase self-hosted 上，所以最权威的方式是在同一个 Postgres transaction 里调用 `realtime.send()`。这样有几个好处：

- **事务一致**：写入和广播不会分叉；rollback 时二者一起回滚。
- **不需要 service-role HTTP 路径**：后端不需要持有 Supabase service key。
- **覆盖所有写入方**：Prisma、raw SQL、未来的 cron job、手动 `psql` 修补都会统一广播。
- **单一事实来源**：协作语义来自 `IssueActivity.metadata.eventType`，而 `issue.service.ts` 已经会为每个 workflow action 写入这个 metadata。不需要新增后端广播代码。

## 烟雾测试（两个浏览器，同一 workspace）

用浏览器 A 和浏览器 B 登录同一 workspace 的两个不同成员，并分别打开 `/tasks`（或 `/inbox`）。

### 1. Workflow review request

在 A：打开一个 workflow issue -> 点击 **请求 Review** -> 选择 B 作为 reviewer -> 提交。

B 的预期表现（约 1 秒内，无需手动刷新）：

- Inbox 的 `Needs Response` bucket 新增 1 条 item，标题指向这次 workflow review request。
- 如果 B 已经打开同一个 workflow issue：collaboration status card 切换到 "review pending"，并且 B 作为 reviewer 时 action buttons 可用。
- B 的任务列表 `Waiting For Me` 数量增加。

### 2. Handoff request

在 A：打开 workflow issue -> 点击 **请求交接** -> 选择 B 作为 target -> 提交。

B 的预期表现：

- 新增 inbox item `workflow.handoff.requested`，bucket 为 `Needs Response`。
- inline 显示 "Accept handoff" 按钮。
- B 点击 Accept 后：A 的 workflow detail 在 1 秒内把 current assignee 切换为 B。

### 3. Blocked

在 A：点击 **标记阻塞**，并填写 reason。

所有打开该 project / workflow 的 workspace 成员预期表现：

- Project summary 的 blocked issue 列表增加 1 条。
- Workflow node card 显示 blocked 状态和 reason。
- 如果 assignee 正在看 Tasks 页面，`Blocked` section 增加 1 条。

### 4. Project brief edit

在 A：编辑 project brief，或修改 risk level。

B 的预期表现（B 打开 project 页面）：

- Project header 重新渲染，显示新的 brief / risk badge。
- `["projects", workspaceId]` 和 `["project-summary", workspaceId]` 都会失效重拉。

### 5. Inbox 状态变化同步到同一用户的其他 tab

同一个用户打开两个 tab。在 tab A：snooze 一条 inbox item。

tab B 的预期表现：

- 被 snooze 的 item 从 primary feed 消失，并在约 1 秒内出现在 `Later`，不需要刷新。

## 如何验证 migration 已应用

```sql
-- 函数存在
\df+ public.realtime_inbox_item_broadcast
\df+ public.realtime_project_summary_broadcast
\df+ public.can_access_realtime_topic

-- Trigger 存在
select event_object_table, trigger_name
  from information_schema.triggers
 where trigger_name in (
   'realtime_inbox_item_broadcast',
   'realtime_project_summary_broadcast',
   'realtime_issue_activity_created_broadcast'
 );

-- 手动测试：插入一条带 metadata 的假 workflow activity
insert into public.issue_activities (id, issue_id, actor_id, action, metadata)
values (
  gen_random_uuid(), '<some_issue_id>', '<some_member_id>',
  'workflow.test',
  jsonb_build_object(
    'kind', 'workflow',
    'eventType', 'workflow.review.requested',
    'runStatus', 'WAITING_REVIEW',
    'currentStepId', 'step1',
    'nextStepId', 'step2'
  )
);
-- 订阅 workflow_issue:<issue_id> 的客户端应该收到这个事件。
```

## 已知限制 / 后续事项

### 清理项（单独 PR，烟雾测试通过后处理）

前端当前仍会在每次 mutation 后，从 `useIssueApi.ts` 和 `useComment.ts` 调用 `broadcastIssueUpdated`、`broadcastWorkflowRunEvent`、`broadcastIssueCreated` 等函数。这些现在已经是 DB trigger 发出的事件的**重复广播**。它们是无害的（payload 和 topic 相同），但会浪费一次网络往返，并略微增加 query invalidate 被触发两次的可能性。

烟雾测试通过后建议清理：

- `src/hooks/useIssueApi.ts` - 删除约第 178、256、313、816、870、929、986 行附近的 broadcast 调用
- `src/hooks/useComment.ts` - 删除约第 46 行附近的 broadcast 调用
- `src/lib/realtime/broadcast.ts` - 删除该文件
- `src/api/index.ts` 等 - 删除剩余 import

### 可以考虑移除的 dead trigger

`realtime_issue_workflow_broadcast`（上一个 migration 创建）会发出 `workflow.node.status_changed`、`workflow.node.moved_next`、`workflow.node.moved_previous`。这些事件名**不在 `events.ts` 里**，当前没有客户端订阅。

这个 migration 之后，对等的语义事件已经通过 `realtime_issue_activity_created_broadcast` 从 activity row metadata 流出。确认没有外部依赖后，可以在后续 migration 里删除 `_workflow_broadcast` function 和 trigger。

### 不在 Phase 1 范围内

- 把 `pendingReviewerId` / `pendingHandoffTargetId` / `blockedReason` 提升为 Issue 的一等字段，这样订阅方就不需要从 activity metadata 里读责任人信息。这个是 Phase 2 #4。
- 从 `issue.service.ts` 中抽出 `WorkflowRunService`。这个是 Phase 2 #5。
- 在 workflow ReactFlow 图上增加可视化 `current step` 高亮。这个是 Phase 3 #6。
