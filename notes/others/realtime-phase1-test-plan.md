# Realtime Phase 1 — Deployment Status, Expected Effects & Test Plan

> Companion to `notes/realtime-phase1-rollout.md`. That doc covers what
> shipped and why; this doc covers deployment status, what users should
> see after the migration, and the full test matrix.

## 部署状态

| 项 | 状态 |
|---|---|
| `supabase/migrations/20260410120000_realtime_semantic_inbox_project.sql` | ✅ 已应用到本地 Supabase (`postgres@127.0.0.1:54322`) |
| `realtime_inbox_item_broadcast` trigger (INSERT/UPDATE/DELETE on `inbox_items`) | ✅ |
| `realtime_project_summary_broadcast` trigger (INSERT/UPDATE/DELETE on `projects`) | ✅ |
| `realtime_issue_activity_created_broadcast` trigger function (升级后) | ✅ |
| `can_access_realtime_topic()` 支持 `user:{userId}` topic | ✅ ACL 自检通过：self_ok=t / other_blocked=f / empty_blocked=f |
| 前端 `events.ts` / `topics.ts` / `useUserRealtime.ts` / `useWorkspaceRealtime.ts` | ✅ typecheck pass |

> **远程部署说明**：上面动作只在本地 Supabase 实例。要推到生产 self-host
> 实例，下次连上远端后跑 `supabase db push`（会把这个 migration 一并 push），
> 或在远端 psql 里直接应用同一个 SQL 文件。远端尚未动过，需要单独授权。

## 预期效果（按用户体感分类）

### A. 协作动作即时可见（核心收益）

任何一个工作流相关的协作动作 —— review request、handoff request、blocked、
unblocked、approve、changes_requested、advance、revert、record submitted、
run completed —— 现在**只要后端 service 写一条 IssueActivity 行**（这一步本来
就在做），就会从 DB trigger 自动广播出去：

1. 同时在线的其他用户**无需刷新**就能看到协作状态翻转
2. 被指定为 reviewer / handoff target 的用户**收到 inbox 推送**（user channel）
3. 被影响项目的 project summary 在所有打开该项目页的客户端**自动刷新**
4. 当前 workflow issue 详情页的 collaboration status 卡片**即时更新**

### B. Inbox 不再是 pull-based

之前 inbox 信号是 GET 时按需重算的；现在只要 `inbox_items` 写一行，目标
用户的所有打开的 tab 立刻收到 `inbox.updated` 事件，inbox / inbox-summary /
my-work 三个 query 立即失效重拉。

实际表现：
- 同一个用户开两个 tab，一个 tab 处理 inbox（mark read / snooze / done），
  另一个 tab 在 1 秒内同步状态
- A 给 B 发 review request，B 不需要刷新就能在 inbox 看到新条目
- 别的 workspace 成员**不会收到**这条 push（user 通道隔离）

### C. Project 元信息变更同步

编辑项目 brief、改 status、改 owner、调 risk level、改 phase、改 visibility
—— 工作区里所有打开了 projects 列表或某个 project 详情页的用户都会自动
重渲染。无意义的 updatedAt 跳动不会触发广播。

### D. 不在范围（注意预期边界）

- ❌ Workflow ReactFlow 节点图上的 "YOU ARE HERE" 高亮 —— Phase 3 #6
- ❌ Reviewer / handoff target 是 DB 字段 —— 还藏在 metadata 里，Phase 2 #4
- ❌ Decision log / risk audit timeline —— Phase 4
- ❌ Doc 触发 inbox signal —— Phase 3 #8
- ❌ 同一动作可能产生**两次**前端 invalidate（旧的 frontend `broadcast*` 调用
  还在），无害但浪费一次 RTT，等清理 PR 后消除

## 完整测试用例表

每条都按"两浏览器同 workspace 不同用户"的前提，除非另外注明。
**期望延迟 ≤ 1.5s**，不需要任何手动刷新。

### 一、Workflow 协作语义事件（issue_activities trigger）

| # | 步骤 | 触发动作（A） | 期望表现（B） | 验证 query 失效 |
|---|---|---|---|---|
| W1 | A 在 `/workflows/<id>` 的 workflow issue 详情页 | 点击"请求 Review"，指定 B | B 在 `/inbox` 看到新 `Needs Response` 条目，标题含 "review requested"；若 B 已开同一 issue，collaboration status 卡片切到 `WAITING_REVIEW`，显示 reviewer = B；B 的 review 按钮启用 | `["issue", ws, id]` `["workflow-run", ws, id]` `["issue-activities", id]` `["inbox", ws]` `["inbox-summary", ws]` |
| W2 | B 收到 W1 的 review request | B 点"通过 Review" | A 的 collaboration status 卡片切回 active，下一步可推进；inbox 中 W1 条目自动标记 done | 同上 |
| W3 | 重复 W1 | B 点"请求修改"，附带 reason | A 的卡片切回执行态，看到 "changes requested" 活动条；对应 inbox 状态变化 | 同上 |
| W4 | A 在 workflow issue | 点"请求交接"，指定 B | B 收到 inbox `workflow.handoff.requested`，bucket = `Needs Response`，inline 显示 Accept 按钮 | 同上 |
| W5 | B 在 inbox / 工作流详情 | 点 Accept handoff | A 的 collaboration status 卡片当前 assignee 切到 B；A 的 inbox W4 条目自动 done | 同上 |
| W6 | A 在 workflow issue | 点"标记阻塞"输入 reason | 所有打开该项目页的用户：项目页 blocked-issue 列表 +1；A/B 的 tasks 页 `Blocked` section +1（如果他们是 assignee） | `["issues"]` `["my-work"]` `["project-summary"]` |
| W7 | A 在阻塞中的 issue | 点"解除阻塞" | 同上反向：blocked 列表 -1，活动 timeline 出 `unblocked` 条目 | 同上 |
| W8 | A 在最后一步 | 点 advance | A 自己看到 run 完成；B 若打开相同 issue，状态卡片显示 `DONE`；项目 summary 完成数 +1 | `["issue"]` `["workflow-run"]` `["project-summary"]` |
| W9 | A 在中间步骤 | 点 revert | B 的 workflow 视图回退到上一步 | 同上 |
| W10 | A 提交 step record（attachments + result text） | submit-record | B 的 records tab 立即出现新条目 | `["issue-step-records"]` |
| W11 | A 创建一个新的 workflow issue | 创建并选模板 | B 的 issues 列表 +1，my-work / project-summary 同步 | `["issues"]` `["my-work"]` `["project-summary"]` |

### 二、Inbox 推送（inbox_items trigger）

| # | 场景 | 触发 | 期望 |
|---|---|---|---|
| I1 | 同用户两 tab | tab A 在 inbox 点 "mark as read" | tab B 的对应条目立即从 unread 视觉切到 seen，无需刷新 |
| I2 | 同用户两 tab | tab A snooze 一条 | tab B 的条目从 Primary 消失，1s 内出现在 Later |
| I3 | 同用户两 tab | tab A 点 "mark done" / clear | tab B 的条目从 Primary 移到 Cleared |
| I4 | 同用户两 tab | tab A undo / unread | tab B 的条目从 Cleared 回到对应 bucket |
| I5 | 用户 A、B 不同 | A 给 B 发 review request | B 的 inbox 出现新条目，**A 的 inbox 不变** |
| I6 | 用户 A、C 不在同一 workspace | A 给 B 发条目 | C 完全收不到（user 通道隔离） |
| I7 | 后端 cron / `inbox.service.syncUserInboxState` 重算未变化的条目 | 触发 sync | **不应**有 inbox.updated 广播（trigger 的去噪段会过滤掉无意义 update） |

### 三、Project 元信息广播（projects trigger）

| # | 场景 | 触发 | 期望 |
|---|---|---|---|
| P1 | A 在项目设置 | 编辑 brief | B 打开同一项目页：header brief 更新；项目列表项的描述更新 |
| P2 | A 在项目页 | 改 status（ACTIVE → SHIPPING） | B 的项目状态徽章变化 |
| P3 | A 在项目页 | 调整 risk level | B 的项目风险徽章变化；项目列表 risk 排序受影响 |
| P4 | A 在项目页 | 切换 owner | B 的 owner 显示更新 |
| P5 | A 在项目页 | 改 phase / visibility | 同步刷新 |
| P6 | A 创建新项目 | 提交 | B 的 `/projects` 列表 +1 |
| P7 | A 删除项目 | 确认删除 | B 的 `/projects` 列表 -1，若 B 当时正在该项目页，需要降级处理（前端层另说，trigger 已发出 DELETE 事件） |
| P8 | A 在项目里改了 issue 标题（不是 project 行本身） | 编辑 issue | B 的 project summary 仍能刷新（走的是 `realtime_issue_workspace_broadcast`，不是 project trigger） |
| P9 | 后端 prisma `update` 但只触发 `updatedAt` 跳动 | 任何无意义更新 | **不应**广播（去噪段过滤） |

### 四、ACL / 安全

| # | 场景 | 期望 |
|---|---|---|
| S1 | 未登录用户尝试订阅 `user:abc` | 拒绝（auth.uid() 为 null） |
| S2 | 用户 X 尝试订阅 `user:Y` | 拒绝（topic resource ≠ uid） |
| S3 | 用户 X 尝试订阅 `workspace:Z`，X 不是 Z 的成员 | 拒绝（既有逻辑） |
| S4 | 个人 workspace 的 owner 订阅自己的 `workspace:Z` | 通过 |
| S5 | 团队 workspace 的成员订阅 `workspace:Z` | 通过 |
| S6 | 团队 workspace 的非成员订阅 `workspace:Z` | 拒绝 |
| S7 | 用户订阅 `issue:I`，I 所属 workspace 用户没权限 | 拒绝（resolver 走 issues→workspace→membership） |

### 五、回归（确保旧功能没坏）

| # | 场景 | 期望 |
|---|---|---|
| R1 | 评论创建 | comment.created 仍正常发出（旧 trigger 没动） |
| R2 | issue 字段变更（title / state / assignee） | issue.updated 仍正常 |
| R3 | issue.activity.created 事件 | 仍正常（新 trigger 第一步就发它） |
| R4 | issue step record 创建 | 仍正常 |
| R5 | 现有前端 `broadcastIssueUpdated` 调用（冗余） | 不应导致 query 多次失效报错或竞态 |

### 六、性能 / 噪音控制

| # | 场景 | 期望 |
|---|---|---|
| N1 | 同一用户在 30 秒内 mark read / unread 同一条目 5 次 | trigger 发 5 次 inbox.updated，前端 react-query 应去抖（默认行为） |
| N2 | 后端批量 upsert 100 条 inbox items | 100 条 inbox.updated 广播 —— 看 user channel 是否有压力（如有问题，下一步可加 NOTIFY 节流） |
| N3 | 项目下 100 个 issue 同时 patch | 100 条 issue.updated workspace 广播；前端 react-query 自动 dedupe invalidate |

## 跑测试的最快路径

1. **最小验证**（5 分钟）：W1 → W4 → W6 → I1 → P1 这 5 条覆盖了 4 个 trigger 各自的 happy path
2. **完整 happy path**（15 分钟）：跑完一、二、三所有用例
3. **安全 + 回归**（10 分钟）：四 + 五

## 无 UI 的 SQL 烟雾测试（可选）

如果要在不开浏览器的情况下证明 trigger 链路是通的，可以往各表塞测试行
然后查 `realtime.messages`：

```sql
-- 1. 验证 workflow 语义事件广播
insert into public.issue_activities (id, issue_id, actor_id, action, metadata)
values (
  gen_random_uuid(), '<some_existing_issue_id>', '<some_existing_member_id>',
  'workflow.test',
  jsonb_build_object(
    'kind', 'workflow',
    'eventType', 'workflow.review.requested',
    'runStatus', 'WAITING_REVIEW',
    'currentStepId', 'step1',
    'nextStepId', 'step2'
  )
);

-- 2. 验证 inbox 推送
update public.inbox_items
   set status = 'seen', read_at = now()
 where id = '<some_existing_inbox_item_id>';

-- 3. 验证 project summary
update public.projects set brief = '测试一下广播' where id = '<some_existing_project_id>';

-- 4. 查最近广播出去的 realtime 消息
select inserted_at, topic, event, payload
  from realtime.messages
 order by inserted_at desc
 limit 20;
```

期望看到 workflow.review.requested、inbox.updated、project.summary.invalidated
这三种事件分别落在对应的 topic 上。
