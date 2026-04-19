import type {
  AiExecutionActionDefinition,
  AiExecutionCapabilities,
  AiExecutionManifest,
} from "@/lib/ai/types";

export const READ_TOOL_NAMES = [
  "get_workspace_summary",
  "get_current_actor_context",
  "search_projects",
  "get_project_detail",
  "list_issues",
  "search_issues",
  "get_issue_detail",
  "search_workflows",
  "get_workflow_run_detail",
  "search_docs",
  "get_doc_detail",
  "search_workspace_members",
  "assemble_coding_prompt",
] as const;

export type ReadToolName = (typeof READ_TOOL_NAMES)[number];

export interface ReadToolDefinition {
  purpose: string;
  argsSchema: string;
  whenToUse: string;
  returns: string;
}

export const READ_TOOL_DEFINITIONS: Record<ReadToolName, ReadToolDefinition> = {
  get_workspace_summary: {
    purpose: "读取当前 workspace 的整体协作摘要、项目/任务/文档计数和最近对象。",
    argsSchema: "{}",
    whenToUse: "用户问整体进展、最近变化、当前工作面，或你需要先建立全局上下文时。",
    returns: "workspace summary",
  },
  get_current_actor_context: {
    purpose: "读取当前登录用户在当前 workspace 里的 userId / teamMemberId / role。",
    argsSchema: "{}",
    whenToUse: "用户说“我 / 自己 / 当前由我处理”时，或需要把当前用户映射成真实 userId / memberId 时。",
    returns: "actor context",
  },
  search_projects: {
    purpose: "按项目名、brief、描述搜索真实项目。",
    argsSchema: '{ "query": "口袋吉他", "limit"?: 8 }',
    whenToUse: "用户提到项目名但没有 projectId，或你需要确认项目是否存在时。",
    returns: "project matches with projectId",
  },
  get_project_detail: {
    purpose: "读取某个项目的深度信息、关键任务和风险概览。",
    argsSchema: '{ "projectId": "..." }',
    whenToUse: "已经拿到真实 projectId，且需要了解项目上下文、关键 issue 或风险时。",
    returns: "project detail",
  },
  list_issues: {
    purpose: "按项目、当前用户和状态类别列出 issue。",
    argsSchema:
      '{ "projectId"?: "...", "assigneeScope"?: "ANY" | "ME", "stateCategories"?: string[], "limit"?: number }',
    whenToUse: "用户想看某个项目下的 issue 列表、我的任务，或按状态筛选 issue 时。",
    returns: "filtered issue list",
  },
  search_issues: {
    purpose: "按 issue key、标题、描述、项目名搜索真实 issue。",
    argsSchema: '{ "query": "SYN-35", "projectId"?: "...", "limit"?: 8 }',
    whenToUse: "用户提到 issue 名称、issue key、某条流程任务，但没有 issueId 时。",
    returns: "issue matches with issueId",
  },
  search_workflows: {
    purpose: "按 workflow 模板名称、描述、版本搜索真实 workflow。",
    argsSchema: '{ "query": "黑客松报名流程", "limit"?: 8 }',
    whenToUse: "用户提到某个 workflow 模板，但没有 workflowId，或想基于 workflow 创建运行实例时。",
    returns: "workflow matches with workflowId",
  },
  get_issue_detail: {
    purpose: "读取 issue 的正文、状态、关联文档、最近评论和 handoff 状态。",
    argsSchema: '{ "issueId": "..." }',
    whenToUse: "已经拿到真实 issueId，且需要 issue 深度上下文时。",
    returns: "issue detail",
  },
  get_workflow_run_detail: {
    purpose: "读取 workflow run 当前步骤、最近 step records 和活动。",
    argsSchema: '{ "issueId": "..." }',
    whenToUse: "需要了解流程步骤、review / handoff 状态、当前 assignee 或 blocked 原因时。",
    returns: "workflow run detail",
  },
  search_docs: {
    purpose: "在当前 workspace 内搜索可读文档。",
    argsSchema: '{ "query": "设计评审", "limit"?: 8 }',
    whenToUse: "用户提到某篇文档、设计稿、决策记录，但没有 docId 时。",
    returns: "doc matches with docId",
  },
  get_doc_detail: {
    purpose: "读取文档正文摘录与最近 revisions。",
    argsSchema: '{ "docId": "..." }',
    whenToUse: "已经拿到真实 docId，且需要文档内容上下文时。",
    returns: "doc detail",
  },
  search_workspace_members: {
    purpose: "按成员姓名、邮箱、role 搜索当前 workspace 成员。",
    argsSchema: '{ "query": "Luke", "limit"?: 8 }',
    whenToUse: "需要把“Luke / 设计负责人 / 我”映射成真实 userId 或 teamMemberId 时。",
    returns: "workspace member matches with userId and teamMemberId",
  },
  assemble_coding_prompt: {
    purpose: "组装可直接交给 Claude Code / Codex 的编码交接 prompt。",
    argsSchema: '{ "issueId": "..." }',
    whenToUse: "用户要 handoff prompt，或 attach_coding_prompt_to_issue 缺少 prompt 正文时。",
    returns: "coding prompt assembly",
  },
};

function formatFieldHandbook(action: AiExecutionActionDefinition) {
  if (!Array.isArray(action.fields) || action.fields.length === 0) {
    return "  - 无字段";
  }

  return action.fields
    .map((field) => {
      const details = [
        field.required ? "required" : "optional",
        field.type,
        field.entityRef ? `entityRef=${field.entityRef}` : null,
        field.omitWhenUncertain ? "omitWhenUncertain=true" : null,
        field.clarifyWhenAmbiguous ? "clarifyWhenAmbiguous=true" : null,
      ]
        .filter(Boolean)
        .join(", ");
      const enumText =
        field.type === "enum" && Array.isArray(field.options)
          ? ` | options: ${field.options.join(" | ")}`
          : "";
      const hintText =
        field.type === "enum" && Array.isArray(field.enumHints)
          ? ` | enumHints: ${field.enumHints
              .map((hint) =>
                hint.aliases.length > 0
                  ? `${hint.value} <= ${hint.aliases.join("/")}`
                  : hint.value,
              )
              .join("; ")}`
          : "";
      const exampleText =
        Array.isArray(field.examples) && field.examples.length > 0
          ? ` | examples: ${field.examples.join(" / ")}`
          : "";

      return `  - ${field.name}: ${field.description} [${details}]${enumText}${hintText}${exampleText}`;
    })
    .join("\n");
}

function buildReadToolCatalog() {
  return READ_TOOL_NAMES.map((toolName) => {
    const definition = READ_TOOL_DEFINITIONS[toolName];
    return `- ${toolName}(args: ${definition.argsSchema})\n  用途: ${definition.purpose}\n  适用场景: ${definition.whenToUse}\n  返回: ${definition.returns}`;
  }).join("\n");
}

function buildActionCatalog(
  manifest: AiExecutionManifest,
  capabilities: AiExecutionCapabilities,
  allowlist: ReadonlySet<string>,
) {
  const capabilitiesByKey = new Map(
    capabilities.actions.map((action) => [action.key, action]),
  );

  const actions = manifest.actions
    .filter((action) => allowlist.has(action.key))
    .filter(
      (action) =>
        capabilitiesByKey.get(action.key)?.availability?.status !==
        "unavailable",
    );

  if (actions.length === 0) {
    return "- 当前没有可用写动作，只能读取上下文并给建议。";
  }

  return actions
    .map((action) => {
      const capability = capabilitiesByKey.get(action.key);
      const availability = capability?.availability?.status ?? "unknown";
      return [
        `- ${action.key} (${action.approvalMode}, ${action.targetType}, availability=${availability})`,
        `  描述: ${action.description}`,
        `  字段:`,
        formatFieldHandbook(action),
        `  sampleInput: ${
          action.sampleInput && Object.keys(action.sampleInput).length > 0
            ? JSON.stringify(action.sampleInput)
            : "{}"
        }`,
      ].join("\n");
    })
    .join("\n");
}

export function buildPlannerSystemPrompt(params: {
  baseSystemPrompt: string;
  manifest: AiExecutionManifest;
  capabilities: AiExecutionCapabilities;
  allowlist: ReadonlySet<string>;
}) {
  return [
    params.baseSystemPrompt,
    "",
    "你现在运行在 Synaply 的 AI execution planner 中。",
    "你的职责不是直接生成最终可执行 payload，而是先理解用户意图，然后输出结构化计划。",
    "你必须严格只返回一个 JSON object，不要输出 Markdown、解释、前后缀或代码围栏。",
    "",
    "只允许五种返回形态：",
    '{"type":"final","reply":"给用户的最终回复"}',
    '{"type":"clarify","question":"需要向用户追问的话","missing":["缺失信息"],"reason":"为什么现在不能安全执行"}',
    '{"type":"read","tool":"search_projects","arguments":{"query":"Synaply"}}',
    '{"type":"prepare_execute","actionKey":"create_issue","inputDraft":{"title":"补齐 review 链路","projectId":"Synaply","priority":"高优先级"},"missing":[],"confidence":0.9,"evidence":"用户明确要求在 Synaply 项目下创建高优先级 issue"}',
    '{"type":"prepare_execute_many","summary":"批量创建项目拆分 issue","items":[{"actionKey":"create_issue","inputDraft":{"title":"定义 action contract","projectId":"Synaply"},"confidence":0.8,"evidence":"用户要求拆成多条 issue"}]}',
    "",
    "planner 规则：",
    "1. 当用户只是提问、求解释、求建议、求总结时，返回 final 或 read，不要准备执行。",
    "2. 当用户明确想把内容落到系统里时，优先返回 prepare_execute / prepare_execute_many，而不是只给泛泛建议。",
    "3. 对写动作，inputDraft 可以保留自然语言草案，但不要假装已经拿到了真实 *Id，也不要假装 enum 已经 canonical。",
    "4. 如果你已经明确知道需要先读某个对象才能回答问题或缩小范围，先用 read。",
    "5. 如果用户信息天然不足，或你确认无法唯一判断 action / target / enum，返回 clarify。",
    "6. 如果用户明确要求批量创建多个同类动作，必须使用 prepare_execute_many。",
    "7. 对 attach_coding_prompt_to_issue，如果用户只是要展示 prompt，可优先 read assemble_coding_prompt；只有用户明确要求写回 issue 时，才 prepare_execute。",
    "8. 不要猜 projectId / issueId / docId / workflowId / targetUserId / ownerMemberId。",
    "9. 当前 runtime 会在 compiler 阶段把自然语言映射为真实 ID 和 canonical enum。你的任务是把意图表达清楚，而不是输出伪造参数。",
    "10. 当用户在 workspace / project 范围内询问“有多少任务 / 有哪些任务 / 哪些未完成 / 列出任务”时，优先用 list_issues，不要直接凭记忆回答。",
    "11. 当用户要把普通 issue 标记为完成、取消或进行中时，优先使用 update_issue，并在 inputDraft 中提供 stateCategory。",
    "12. 当用户明确说“基于某个 workflow 创建 issue / 流程任务 / 运行实例”时，优先使用 create_workflow_run，而不是 create_issue。",
    "",
    "Read tools:",
    buildReadToolCatalog(),
    "",
    "Available execution actions:",
    buildActionCatalog(params.manifest, params.capabilities, params.allowlist),
  ].join("\n");
}
