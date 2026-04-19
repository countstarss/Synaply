## AI 意图识别与结构化执行强化方案

### Summary
目标是把当前 `/api/ai/threads/[threadId]/messages` 这条链路，从“模型输出 JSON + prompt 约束”升级成“意图理解 -> 参数编译 -> 结构化校验 -> 执行”的两段式编译架构，并且前后端一起收口。

第一阶段按你选的范围，覆盖当前 frontend allowlist 的全部 6 个写动作：`create_project`、`create_issue`、`create_comment`、`advance_workflow_run`、`request_workflow_review`、`attach_coding_prompt_to_issue`。歧义策略采用你选的默认：不能唯一映射到 action / enum / 目标对象时，先追问澄清，不直接执行。

### Key Changes
#### 1. 把 backend `ACTION_DEFINITIONS` 变成唯一规范源
- 继续以 `apps/backend/src/ai-execution/ai-execution.service.ts` 的 `ACTION_DEFINITIONS` 为单一真源，不在 frontend 再手写第二套动作规范。
- 扩展 `AiActionFieldDescriptor` / manifest 输出，新增以下元数据，供 prompt 和编译器共同消费：
  - `entityRef?: "project" | "issue" | "workflow" | "doc" | "member" | "user"`
  - `clarifyWhenAmbiguous?: boolean`
  - `omitWhenUncertain?: boolean`
  - `examples?: string[]`
  - `enumHints?: Array<{ value: string; aliases: string[]; description: string }>`
- 将 backend 现有 `ENUM_ALIAS_MAP` 从“内部兜底”升级为 manifest 可见元数据的一部分，至少覆盖本期动作涉及的枚举：
  - `ProjectStatus`
  - `ProjectRiskLevel`
  - `IssuePriority`
  - `IssueType`
  - `VisibilityType`
  - `WorkflowReviewOutcome`
- 保留 backend DTO 校验和 enum normalize 作为最后一道 authority，但 frontend 目标是执行前就产出 canonical enum，不再把自然语言原样塞进 enum 字段。

#### 2. 把 frontend runtime 改成两段式编译
- 在 `src/app/api/ai/threads/[threadId]/messages/route.ts` 中，把当前单一 decision loop 拆成两个明确阶段：
  - `Intent Planner`: 只负责理解用户意图，输出结构化计划，不允许直接产出最终执行 payload。
  - `Action Compiler`: 纯代码层，结合 manifest / field metadata / read tool 结果，把 planner 输出编译成可执行 `actionKey + input`。
- Planner 输出格式改成显式区分：
  - `final`
  - `clarify`
  - `read`
  - `prepare_execute`
  - `prepare_execute_many`
- `prepare_execute(_many)` 中只允许包含：
  - 目标动作 key
  - 字段意图草案
  - 需要解析的实体引用
  - 缺失信息列表
  - 置信度 / 证据摘要
- Compiler 规则固定为：
  - 自由文本只能落到明确的 text fields，如 `title`、`name`、`brief`、`description`、`comment`、`reason`、`resultText`、`prompt`
  - `*Id` 字段必须来自 read tool 解析结果，不能直接取用户原文
  - `enum` 字段必须映射到 manifest 给出的原始值
  - 如果字段 optional 且用户没有明确表达，则省略
  - 如果字段 optional 但用户明确表达了一个无法唯一映射的值，则先澄清
  - 如果字段 required 且无法唯一映射，则必须返回 `clarify`
- 删除当前 `parseAgentDecision` 的“JSON 解析失败就降级成 final 文本”策略。新策略改为：
  - planner 非法输出时，重试一次
  - 二次失败后返回安全澄清，不执行任何动作
  - 不再把非法 decision 当成普通 assistant reply 透传

#### 3. 补齐 read tools，支撑“先理解再落参”
- 为了让编译器真正能解析自然语言到真实对象，补齐当前缺失的只读工具：
  - `search_issues(args: { query: string, projectId?: string, limit?: number })`
  - `search_workspace_members(args: { query: string, limit?: number })`
- frontend read tool 定义从纯字符串 catalog 改成结构化 `READ_TOOL_DEFINITIONS`，包含：
  - name
  - purpose
  - args schema
  - 适用场景
  - 返回的实体类型
- 编译器按字段 `entityRef` 自动决定 lookup 路径：
  - `projectId` -> `search_projects`
  - `issueId` -> `search_issues`
  - `ownerMemberId` / `targetUserId` -> `search_workspace_members`
  - “我 / 当前由我处理” -> `get_current_actor_context`
- `advance_workflow_run`、`request_workflow_review`、`create_comment` 这三类动作全部改成必须先拿到真实 `issueId` 后才允许进入 execute。

#### 4. 让 AI 真正“看到规范”
- 保留 `buildAiSystemPrompt`，但拆成两层：
  - `product policy`: Synaply 的协作对象关系、handoff / blocker / docs / workflow 的产品语义
  - `execution policy`: 结构化执行规则、ID 解析规则、enum 规则、澄清规则
- 不把根目录 `AGENTS.md` 原文整块注入模型；改成提炼后的 runtime policy 常量，确保 AI 看到的是产品规则，不是开发流程噪音。
- execution prompt 不再只拼 action catalog 文本，而是由 manifest + enum hints + read tool definitions 生成“领域手册”片段，至少包含：
  - 允许动作
  - 每个字段的语义
  - 每个 enum 的 canonical value 与常见自然语言别名
  - 什么情况下必须先 read
  - 什么情况下必须先 clarify

### Public Interfaces / Types
- Backend:
  - `AiActionFieldDescriptor` 增加 `entityRef`、`clarifyWhenAmbiguous`、`omitWhenUncertain`、`examples`、`enumHints`
  - `AiExecutionManifest.actions[*]` 同步返回这些字段
  - 新增 AI context 只读接口：
    - `search_issues`
    - `search_workspace_members`
- Frontend:
  - 新增内部 planner/compiler types，例如：
    - `IntentPlan`
    - `PreparedExecution`
    - `CompiledExecutionInput`
    - `ClarificationDecision`
  - `/api/ai/threads/[threadId]/messages` 对外 response 形状不改，仍然返回 assistant text；变化只发生在内部 runtime 流程

### Test Plan
- Prompt / planner 场景：
  - 用户说“新建一个项目，团队可编辑，风险中等”时，planner 选 `create_project`，compiler 输出 `visibility=TEAM_EDITABLE`、`riskLevel=MEDIUM`
  - 用户说“给这个项目建一个高优先级 issue”时，planner 不直接写自然语言到 `priority`，而是编译成 `HIGH`
  - 用户说“给 Luke 发 review”时，先走成员搜索，再编译 `targetUserId`
- 歧义场景：
  - 用户说“团队可见”时，不直接猜 `TEAM_READONLY` 或 `TEAM_EDITABLE`，而是返回澄清
  - 用户只说 issue 标题、不提供 ID 时，不允许直接 execute，必须先 `search_issues`
  - planner 输出非法 JSON 时，不允许 fallback 成普通执行结果
- 回归场景：
  - `attach_coding_prompt_to_issue` 仍能自动补齐 prompt assembly
  - direct execution / approval 现有链路不变
  - `execute_many` 仍可工作，但每个 item 都必须经过同样的 compiler 校验
- Backend 场景：
  - manifest 中 enum hints 与 `ENUM_ALIAS_MAP` 一致
  - DTO 校验继续拦截不合法 enum / 多余字段
  - 新增 read tools 返回可供 compiler 消费的稳定结构

### Assumptions
- 本期“已开放动作全做”按当前 frontend allowlist 的 6 个写动作执行，不扩到 backend 全量 action keys。
- backend `ACTION_DEFINITIONS` 是唯一动作规范源；frontend 不再长期维护另一份字段/enum 规则。
- AI 看到的“规范”采用提炼后的 runtime policy，而不是直接读取仓库根 `AGENTS.md` 原文。
- optional 字段默认策略：
  - 用户未提及：省略
  - 用户明确提及但无法唯一映射：先澄清
- backend 继续保留现有 enum alias normalize 作为最后防线，但目标是 frontend compiler 在 execute 前就产出 canonical enum 值。
