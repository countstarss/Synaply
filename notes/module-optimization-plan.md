# 当前模块优化方案

更新时间：2026-04-15

这份文档基于当前仓库里的真实代码状态编写，用来替代此前那批已经与实现脱节的 refactor brief / stage brief。

后续如果要讨论模块级优化，请直接在这份文档上增量更新，不再重新开一组脱离现状的旧式 brief。

## 适用范围

本文件覆盖当前 Synaply 的主要产品模块与支撑模块：

1. Workspace / Team / Permissions
2. Projects
3. Issues
4. Workflows
5. Docs
6. Inbox
7. Tasks / My Work
8. AI
9. Settings / Notifications
10. Legacy / Support Modules

## 判断原则

所有优化建议都应优先服务于这条主链：

`Project -> Issue -> Workflow -> Doc -> Inbox`

如果某个优化不能让这条链更顺、更清晰、更可交接，就不应排在高优先级。

## 当前总判断

当前代码库已经不再处于“模块都只是草图”的阶段，而是进入了“核心对象已形成，但主链闭环还不够稳”的阶段。

最近一轮推进之后，项目状态已经出现了比较明确的阶段变化：

1. Workspace / Team 的 onboarding 基线已经成型，Projects 也已经有了 overview / issues / docs / workflow / sync 的完整分视图结构。
2. Projects 不再是“缺少协作面板”的模块，而是进入了“信息已出现，但需要去重、合并、提升信号密度”的收口阶段。
3. Issues 已经开始具备结构化执行模板，但 blocker / dependency / 搜索 / 列表级快捷动作还没有完全补齐。
4. Workflows 已经有真实的模板、运行态和 usage 信息，下一块最值得直接推进的工作已经从“继续补项目页”转向“清理 workflow 历史遗留实现”。

现在最值得做的不是继续发散出更多产品设想，而是围绕现有代码把下面三件事做扎实：

1. 把 Workflows 残留的本地存储、节点库半成品逻辑、重复同步路径彻底收口。
2. 把 Docs / Inbox 变成真正承接 decision、review、handoff 信号的主链模块。
3. 把 Projects / Issues 已经做出来的能力继续去重和产品化，而不是继续堆更多平行入口。

## 最新进展快照

以下内容已经不应再被当作“待建设能力”：

1. 团队创建、邀请成员、团队设置入口、创建首个项目 / 工作流的 onboarding 主路径已经串起来。
2. Projects 已拆分为更清晰的 overview / issues / docs / workflow / sync 子视图，并补上了项目级 activity / sync timeline。
3. 项目页的关键协作入口已经能直接创建项目文档并跳转到项目 docs。
4. Issues 已补上结构化描述模板入口，开始从自由文本走向可执行上下文。
5. Workflows 列表已经不是纯模板清单，后端和前端都已出现 usage 统计（active run / total run）。

## 1. Workspace / Team / Permissions

### 当前真实状态

- 工作空间切换、团队列表、当前团队解析已经可用。
- 团队创建、团队成员拉取、成员角色更新、移除成员已经落地。
- `useWorkspace` 已接入真实的团队工作空间创建 / 邀请成员链路，不再依赖假数据占位。
- Sidebar 已能直接创建团队工作空间，并按当前角色显示邀请成员入口。
- `useWorkspace` 已统一输出当前 workspace / 当前 team member / 权限摘要的轻量 context。
- 团队设置页已经补上邀请成员入口，并把“创建团队 -> 邀请成员 -> 创建第一个项目 / 工作流”的 onboarding 路径串起来。
- 权限体系已经支撑项目、工作流、Issue、AI 执行等核心写操作。

关键入口：

- `apps/frontend/src/hooks/useWorkspace.ts`
- `apps/frontend/src/hooks/useTeam.ts`
- `apps/frontend/src/components/settings/sections/MembersSettingsSection.tsx`
- `apps/backend/src/team/*`
- `apps/backend/src/common/services/permission.service.ts`

### 潜在优化方案

1. 把 `currentWorkspaceContext` 真正推广到 settings / projects / workflows / AI 等模块，删掉各处重复拼接的权限判断。
2. 把 onboarding 从团队设置页继续延伸到项目页和工作流页里的初始空状态，引导团队完成第一轮真实协作。
3. 把权限可视化做得更清楚，尤其是项目、工作流和 AI 动作的可写边界。

### 建议优先级

- 高：把 workspace actor context 推广到更多模块。
- 中：把 onboarding 延伸到项目 / 工作流 / Docs 首次使用路径。
- 中：完善权限可视化。

## 2. Projects

### 当前真实状态

- `Project` 已经不再只是 Issue 分组容器。
- 项目已经有 `brief`、`status`、`phase`、`riskLevel`、`ownerMemberId`、`lastSyncAt` 等协作语义字段。
- 项目详情页已经聚合了 brief、风险摘要、活跃 issues、docs 数量、workflow 数量、sync 入口。
- 项目页已经拆成 overview / issues / docs / workflow / sync 子视图，Projects 模块的基础信息架构已经比旧版清晰很多。
- 后端已提供项目级 `activity` / `summary` / `workflows` 数据，前端也已经接入项目 activity timeline 和 sync 子页。
- 项目页已经支持直接创建 project doc 并跳转到对应文档上下文。
- 当前主要问题已经不是“没有协作信息”，而是 overview 与 sync 之间仍存在较多重复暴露，尤其是 sync 时间、摘要卡和时间线入口容易重复出现。

关键入口：

- `apps/backend/src/project/project.service.ts`
- `apps/frontend/src/components/projects/ProjectDetailView.tsx`
- `apps/frontend/src/components/projects/ProjectSubviewContent.tsx`
- `apps/frontend/src/lib/fetchers/project.ts`

### 潜在优化方案

1. 合并 overview 与 sync 视图里重复的 sync 信息暴露，避免同一页面多次出现相同时间、相同状态、相同解释。
2. 把“待确认项 / 风险提醒 / 关键进展”进一步提升为行动导向卡片，而不是只停留在计数或摘要文案。
3. 把 project docs 从“计数 + 跳转”继续提升为“关键文档内嵌列表 + 最近更新摘要 + 可直接进入”。
4. 把 project workflows 从“有关联与 usage”继续提升为“当前运行实例、卡在哪一步、谁在推进”的摘要层。
5. 完善项目归档与删除治理，明确 docs / workflow / issue 的生命周期策略。
6. 明确项目 owner 缺失时的处理逻辑，避免出现“有项目但没人真正负责”的悬空状态。

### 建议优先级

- 高：overview / sync 去重合并，收口重复信息。
- 高：待确认项、关键 docs、workflow 运行态进一步产品化。
- 中：归档与删除策略。

## 3. Issues

### 当前真实状态

- Issues 列表、过滤、详情、评论、取消、普通 issue / workflow issue 双模式都已存在。
- 工作流 issue 已经具备 review / handoff / blocked / step record 等协作动作。
- 普通 issue 的创建与详情编辑已经开始引入结构化描述模板，不再完全依赖自由发挥式填写。
- 当前工作树还在继续收口 issue 创建体验，例如 assignee 选择器和多语言消息注入。
- GraphQL 的 `searchIssues` resolver 仍是 TODO，说明历史接口面还没完全清掉。

关键入口：

- `apps/backend/src/issue/issue.service.ts`
- `apps/backend/src/issue/graphql/issue.resolver.ts`
- `apps/frontend/src/components/issue/IssuesPageContent.tsx`
- `apps/frontend/src/components/shared/issue/NormalIssueDetail.tsx`
- `apps/frontend/src/components/issue/WorkflowIssueDetailFlow.tsx`

### 潜在优化方案

1. 把 blocker / dependency / unblock owner / restart expectation 进一步提升为一等字段，而不是只靠运行态和说明文本表达。
2. 给普通 issue 列表补上更直接的快捷动作，例如列表级完成勾选，减少每次都要进入详情页操作。
3. 清理历史遗留的 GraphQL 搜索 TODO，统一 issue 搜索面向 REST / AI / 页面三种入口的能力。
4. 给 issue 详情补一层“决策与交接摘要”，减少成员在评论流里翻找上下文。
5. 统一普通 issue 和 workflow issue 在筛选、列表摘要、状态标签上的表达方式，减少双轨体验分裂。

### 建议优先级

- 高：blocker / dependency 一等字段化。
- 高：普通 issue 列表快捷动作与状态流转。
- 中：搜索与详情摘要收口。

## 4. Workflows

### 当前真实状态

- 工作流模板的创建、编辑、保存、发布已经成立。
- 后端已经负责维护 `json`、`assigneeMap`、`totalSteps`、版本 bump 和发布校验。
- 基于模板创建 workflow issue 已经可以一次性落库关键字段，不再是最早那种“只建最小 issue 再补丁”的状态。
- 运行态已经支持 `advance`、`revert`、`request review`、`handoff`、`blocked` 等动作。
- 工作流列表已经开始显示 usage 信息，至少能看到 active run / total run，不再是完全孤立的模板库。
- 但前端仍残留一批历史本地存储和节点管理占位逻辑，说明这个模块已经不是“功能缺失”，而是明显处在“遗留实现待收口”的阶段。

关键入口：

- `apps/backend/src/workflow/workflow.service.ts`
- `apps/backend/src/issue/issue.service.ts`
- `apps/frontend/src/components/workflow/WorkflowsPageContent.tsx`
- `apps/frontend/src/components/workflow/NodeSettingsModal.tsx`
- `apps/frontend/src/app/[locale]/(main)/workflows/_utils/storage.ts`
- `apps/frontend/src/app/[locale]/(main)/workflows/_utils/node-storage.ts`

### 潜在优化方案

1. 清理 workflow 模块残留的 `localStorage` 存储层，避免模板与运行态出现双数据源。
2. 补完 `NodeSettingsModal` 的后端同步、导入、导出逻辑，彻底结束节点库的半成品状态。
3. 把模板页与运行页的定位写清楚：模板页负责定义，运行页负责推进，项目页负责消费摘要。
4. 在工作流列表里继续强化 usage 信息，例如被哪些项目使用、当前活跃 run 数、删除风险。
5. 收口 realtime Phase 1 遗留项，删除重复 broadcast 调用和 dead trigger。
6. 进一步显式化 review / handoff / blocked / waiting 这些协作动作在 UI 上的主标签，而不只依赖节点状态。

### 建议优先级

- 高：清理本地存储与重复广播。
- 高：节点库同步闭环。
- 中：模板 / 运行态双层定位和 usage 细化。

## 5. Docs

### 当前真实状态

- Docs 已经具备团队 / 项目 / 个人上下文。
- 文档侧边栏、标签页、编辑器、BlockNote 本地草稿恢复、项目级文档创建都已成立。
- 项目页也已经能直接创建项目文档并跳转到对应文档中心。
- 但 docs 仍然更像“文档系统本身”，还没有真正承担 decision log / review packet / handoff packet 的角色。
- 个人文档页仍留有“从实际上下文取值”的 TODO。

关键入口：

- `apps/frontend/src/components/shared/docs/DocsPage.tsx`
- `apps/frontend/src/components/shared/docs/BlockNoteEditor.tsx`
- `apps/frontend/src/components/shared/docs/DocsContext.tsx`
- `apps/frontend/src/hooks/useDocApi.ts`
- `apps/frontend/src/app/[locale]/(main)/personal/doc/page.tsx`
- `apps/backend/src/doc/*`

### 潜在优化方案

1. 修正个人文档页的真实 workspace / auth 上下文绑定，去掉 TODO。
2. 把 docs 从“知识树”推进为“执行上下文树”，优先增加 decision log、review note、release note、meeting action item 这些强结构模板。
3. 建立 doc 与 issue / project / workflow 的双向引用摘要，而不只是通过 projectId 做过滤。
4. 把项目页中的 docs 面板增强成“最近更新、重要文档、待处理文档”的摘要卡。
5. 为文档变更准备高信号事件，例如 critical update、decision changed、needs review，作为 Inbox 上游。
6. 规范多人协作与本地优先冲突处理的可见反馈，减少“已保存 / 草稿 / 冲突”状态的歧义。

### 建议优先级

- 高：decision log / review packet 模板化。
- 高：doc 与 project / issue / workflow 的双向摘要。
- 中：个人文档页上下文修正。

## 6. Inbox

### 当前真实状态

- Inbox 已经是一个真实可用的 P0，而不是 demo 页。
- 后端有持久化模型、feed / summary API、状态流转、去重和自动收口。
- 前端已有 triage 视图、Later / Cleared、Accept handoff、与 My Work / realtime invalidate 的联动。
- 当前仍是“请求时同步投影 + 前端重拉”，还不是写时投影。
- `digest.generated`、`comment.mentioned`、doc / decision signal、通知偏好、badge、系统测试都还没完成。

关键入口：

- `apps/backend/src/inbox/inbox.service.ts`
- `apps/backend/src/inbox/inbox.controller.ts`
- `apps/frontend/src/components/inbox/InboxPageContent.tsx`
- `apps/frontend/src/hooks/useInbox.ts`
- `notes/others/inbox-current-status.md`

### 潜在优化方案

1. 从“请求时同步”升级到“写时同步 projection”，让 Inbox 真正成为个人信号系统。
2. 为 signal 补 actor-rich 文案，例如谁请求 review、谁发起 handoff、谁标记 blocked。
3. 增加导航 badge / 未读数字 / attention 标识，让 Inbox 成为持续可见的行动层。
4. 接入 `comment.mentioned`、decision update、doc review / approval、critical doc updated 等高价值信号。
5. 增加 digest producer，而不是只保留类型。
6. 把通知偏好真正落到设置页，而不是 placeholder。
7. 补服务级测试和端到端测试，确保 signal dedupe、reopen、auto-close 不回归。

### 建议优先级

- 高：写时同步 + badge。
- 高：comment / doc / decision signals。
- 中：digest producer。
- 中：通知偏好系统。

## 7. Tasks / My Work

### 当前真实状态

- 当前“任务页”已经更接近个人执行面板，而不是平行任务系统。
- 它主要消费 `workspace.service.ts` 聚合出的 `MyWorkResponse`，展示 today focus、waiting、in progress、blocked、completed。
- 页面已经支持 accept handoff 和 mark started 等动作。
- 这条线比旧 `task` 模块更贴近 Synaply 的产品定位。

关键入口：

- `apps/backend/src/workspace/workspace.service.ts`
- `apps/frontend/src/components/tasks/TasksPageContent.tsx`
- `apps/frontend/src/hooks/useMyWork.ts`

### 潜在优化方案

1. 继续强化 Tasks 作为“我现在该处理什么”的入口，不要退回到通用待办列表。
2. 把 waiting / handoff / review / blocked 的解释做得更清晰，让跨角色协作动作一眼可读。
3. 优化 today focus 排序策略，把风险、截止时间、交接状态和项目节奏都纳入排序。
4. 增加从 Tasks 直接回跳项目 / workflow / doc 背景的能力，减少孤立处理。
5. 梳理后端 `task` 模块的定位；如果当前主产品已不再依赖旧 Task 对象，应考虑收缩成维护态或迁移计划。

### 建议优先级

- 高：today focus 排序与上下文回跳。
- 中：review / handoff / blocked 可读性增强。
- 中：旧 task 模块定位清理。

## 8. AI

### 当前真实状态

- AI thread、workbench、read tools、execute manifest、approval、coding prompt、structured message cards 都已经存在。
- 当前代码实际完成度明显高于旧 stage brief 中描述的状态。
- 真正还缺的是上线前的可观测性、rate limit、错误体验、用户文档和 smoke test。

关键入口：

- `apps/frontend/src/app/api/ai/threads/[threadId]/messages/route.ts`
- `apps/frontend/src/components/ai/thread/*`
- `apps/frontend/src/components/ai/workbench/*`
- `apps/backend/src/ai-context/*`
- `apps/backend/src/ai-execution/*`
- `apps/backend/src/ai-thread/*`
- 旧的 AI stage brief 已不再保留，后续统一以本文件维护模块优化方向

### 潜在优化方案

1. 补 `AiRunInspector` 与 run detail API，让团队能诊断执行链路。
2. 为 AI route 增加 rate limit、`429 + retry-after`、token budget exceeded 等失败态收口。
3. 增加 smoke tests / scenario tests，覆盖 read -> dryRun -> approval -> confirm -> execute 的完整闭环。
4. 增加最小用户指南，明确“能做什么 / 不能做什么 / approval 为什么存在 / coding handoff 怎么用”。
5. 继续坚持 Next runtime 薄壳原则，避免把业务判断重新塞回 route 层。
6. 把 AI 与项目、Issue、Doc、Inbox 的上下文入口做得更自然，例如从具体对象直接进入 thread 并自动 pin。

### 建议优先级

- 高：observability、rate limit、smoke tests。
- 高：用户指南和错误体验。
- 中：对象入口与预置上下文优化。

## 9. Settings / Notifications

### 当前真实状态

- 个人资料、成员管理、AI 执行能力面板已经不是空白页。
- 但通知偏好页仍然是 placeholder，只展示未来会放什么，不提供真实配置。
- AI 执行设置页更像内部调试面板，尚未和团队运营设置形成清晰边界。

关键入口：

- `apps/frontend/src/components/settings/sections/NotificationsSettingsSection.tsx`
- `apps/frontend/src/components/settings/sections/ProfileSettingsSection.tsx`
- `apps/frontend/src/components/settings/sections/MembersSettingsSection.tsx`
- `apps/frontend/src/components/settings/sections/AiExecutionSettingsSection.tsx`

### 潜在优化方案

1. 把通知偏好真正做出来，优先覆盖 inbox、digest、quiet hours、cross-tool bridge。
2. 区分“用户级偏好设置”和“管理员级运行设置”，避免设置页变成杂糅控制台。
3. AI 执行调试能力建议只对 admin / owner 开放，并明确标注为运行控制而不是普通成员功能。
4. 把设置页和 Workspace / Team 的 onboarding 打通，减少新团队进入后四处找配置入口。

### 建议优先级

- 高：通知偏好落地。
- 中：用户设置 / 管理设置分层。

## 10. Legacy / Support Modules

### 当前真实状态

- `calendar`、`task`、部分 GraphQL resolver、部分 workflow 本地存储属于历史阶段留下的支撑层。
- 它们并非全部无用，但和当前主产品链路的结合程度明显不一致。

### 潜在优化方案

1. 明确哪些模块仍是主路径依赖，哪些进入维护态。
2. 对 legacy 代码做一次 inventory：保留、迁移、删除三类。
3. 优先移除会制造双数据源、双状态机、双入口的问题代码，而不是急着删除所有旧文件。

### 建议优先级

- 高：workflow 本地存储与重复广播。
- 中：旧 task / GraphQL 边角能力盘点。
- 低：calendar 扩展，除非它能明确回到主链。

## 当前建议的整体推进顺序

1. Workflows 的本地存储、节点库同步、重复广播清理。
2. Docs 的 decision log / review packet 模板化。
3. Inbox 写时同步、badge、doc / decision signal。
4. Projects 的 overview / sync 去重合并，以及关键协作卡片收口。
5. Issues 的 blocker / dependency 字段化、普通 issue 列表快捷动作、搜索收口。
6. Tasks / My Work 的 today focus 排序与上下文回跳。
7. AI 的 Stage 6 级打磨：observability、rate limit、smoke tests、用户文档。
8. Workspace / Team / Settings 的通知偏好与长期 onboarding 闭环。

## 不建议现在做的事

1. 不要重新发散出新的“大而全模块”，例如复杂审批引擎、企业级计划排期、内建聊天。
2. 不要为旧 brief 重新补状态，而应直接维护这份当前文档。
3. 不要把 AI 做成另一个平行系统；它必须继续服务主链。
4. 不要为了“看起来完整”去激活旧 `task` 模型或其他 legacy 能力，除非它们能清楚回到主链。

## 维护方式

后续如果某个模块状态发生变化，请直接更新本文件对应章节：

1. 先改“当前真实状态”。
2. 再调整“潜在优化方案”。
3. 最后更新“整体推进顺序”。

不再新增独立的旧式 brief 作为并行真相源。
