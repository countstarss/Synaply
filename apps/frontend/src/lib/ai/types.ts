export const AI_SURFACE_TYPES = [
  "WORKSPACE",
  "PROJECT",
  "ISSUE",
  "WORKFLOW",
  "DOC",
] as const;

export type AiSurfaceType = (typeof AI_SURFACE_TYPES)[number];

export const AI_MESSAGE_ROLES = [
  "USER",
  "ASSISTANT",
  "SYSTEM",
  "TOOL",
] as const;

export type AiMessageRole = (typeof AI_MESSAGE_ROLES)[number];

export const AI_PIN_SOURCES = ["ORIGIN", "USER", "AGENT"] as const;

export type AiPinSource = (typeof AI_PIN_SOURCES)[number];

export interface AiTextPart {
  type: "text";
  text: string;
}

export interface AiToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface AiToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  output: unknown;
  isError?: boolean;
}

export interface AiApprovalRequestPart {
  type: "approval-request";
  approvalId: string;
  actionKey: string;
  summary: string;
  input: Record<string, unknown>;
  preview?: unknown;
  items?: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    preview?: unknown;
    status?: "preview" | "succeeded" | "failed" | "blocked";
    message?: string;
    error?: {
      name?: string;
      message?: string;
      statusCode?: number;
    };
  }>;
  status?: "PENDING" | "CONFIRMED" | "REJECTED" | "EXPIRED";
}

export interface AiCodingPromptPart {
  type: "coding-prompt";
  issueId?: string;
  prompt: string;
  generatedAt: string;
}

export interface AiClarificationOptionPart {
  type: "clarification-options";
  title?: string;
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
}

export interface AiContextChipPart {
  type: "context-chip";
  surfaceType: AiSurfaceType;
  surfaceId: string;
  label: string;
}

export interface AiErrorPart {
  type: "error";
  message: string;
  detail?: unknown;
}

export type AiMessagePart =
  | AiTextPart
  | AiToolCallPart
  | AiToolResultPart
  | AiApprovalRequestPart
  | AiCodingPromptPart
  | AiClarificationOptionPart
  | AiContextChipPart
  | AiErrorPart;

export interface AiThreadPin {
  id: string;
  threadId: string;
  surfaceType: AiSurfaceType;
  surfaceId: string;
  source: AiPinSource;
  pinnedByUserId: string | null;
  pinnedAt: string;
}

export interface AiThreadRecord {
  id: string;
  workspaceId: string;
  creatorUserId: string;
  title: string | null;
  status: string;
  originSurfaceType: AiSurfaceType | null;
  originSurfaceId: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  pins: AiThreadPin[];
}

export interface AiMessageRecord {
  id: string;
  threadId: string;
  runId: string | null;
  role: AiMessageRole;
  parts: AiMessagePart[];
  createdAt: string;
}

export interface AiMessagePage {
  items: AiMessageRecord[];
  nextCursor: string | null;
}

export interface AiRunRecord {
  id: string;
  threadId: string;
  status: string;
  model: string;
  stepCount: number;
  maxSteps: number;
  tokenBudget: number;
  tokensUsed: number;
  startedAt: string;
  finishedAt: string | null;
  lastError: unknown;
  pendingApprovalId: string | null;
}

export interface AiApprovalRecord {
  id: string;
  threadId: string;
  runId: string;
  actionKey: string;
  summary: string | null;
  input: unknown;
  previewResult: unknown;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  expiresAt: string;
}

export interface AiSurfaceSummary {
  surfaceType: AiSurfaceType;
  surfaceId: string;
  title: string;
  status?: string;
  ownerLabel?: string;
  recentActivity?: string;
  text: string;
}

export interface AiWorkspaceSummaryDetail {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  counts: {
    projectCount: number;
    issueCount: number;
    openIssueCount: number;
    docCount: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    phase?: string | null;
    riskLevel?: string | null;
  }>;
  recentIssues: Array<{
    id: string;
    key?: string | null;
    title: string;
    state?: string | null;
    projectName?: string | null;
  }>;
  recentDocs: Array<{
    id: string;
    title: string;
    type: string;
    updatedAt: string;
  }>;
  text: string;
}

export interface AiActorContextDetail {
  actor: {
    userId: string;
    name?: string | null;
    email?: string | null;
    teamMemberId: string;
    role: string;
  };
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  text: string;
}

export interface AiProjectSearchResult {
  items: Array<{
    id: string;
    name: string;
    brief?: string | null;
    status?: string | null;
    phase?: string | null;
    riskLevel?: string | null;
    updatedAt: string;
  }>;
  text: string;
}

export interface AiIssueSearchResult {
  items: Array<{
    id: string;
    key?: string | null;
    title: string;
    description?: string | null;
    state?: string | null;
    projectId?: string | null;
    projectName?: string | null;
    updatedAt: string;
    assigneeLabels: string[];
    currentStepStatus?: string | null;
  }>;
  text: string;
}

export interface AiWorkflowSearchResult {
  items: Array<{
    id: string;
    name: string;
    description?: string | null;
    status?: string | null;
    visibility?: string | null;
    version?: string | null;
    updatedAt: string;
  }>;
  text: string;
}

export interface AiProjectDetail {
  project: Record<string, unknown>;
  summary: Record<string, unknown>;
  text: string;
}

export interface AiIssueDetail {
  issue: Record<string, unknown>;
  linkedDocs: Array<Record<string, unknown>>;
  recentComments: Array<Record<string, unknown>>;
  text: string;
}

export interface AiWorkflowRunDetail {
  workflowRun: Record<string, unknown>;
  stepRecords: Array<Record<string, unknown>>;
  recentActivities: Array<Record<string, unknown>>;
  linkedDocs: Array<Record<string, unknown>>;
  text: string;
}

export interface AiDocDetail {
  doc: Record<string, unknown>;
  recentRevisions: Array<Record<string, unknown>>;
  text: string;
}

export interface AiDocSearchResult {
  items: Array<Record<string, unknown>>;
  text: string;
}

export interface AiWorkspaceMemberSearchResult {
  items: Array<{
    teamMemberId: string;
    userId: string;
    name?: string | null;
    email?: string | null;
    role: string;
    isCurrentActor: boolean;
  }>;
  text: string;
}

export interface AiIssueListResult {
  filters: {
    projectId?: string | null;
    assigneeScope: "ANY" | "ME";
    stateCategories: string[];
    limit: number;
  };
  items: Array<{
    id: string;
    key?: string | null;
    title: string;
    state?: string | null;
    stateCategory?: string | null;
    projectName?: string | null;
    updatedAt: string;
    assigneeLabels: string[];
    currentStepStatus?: string | null;
  }>;
  text: string;
}

export interface AiCodingPromptAssembly {
  issueId: string;
  prompt: string;
  linkedDocIds: string[];
  text: string;
}

export type AiExecutionAvailabilityStatus =
  | "available"
  | "requires_target_check"
  | "unavailable";

export type AiExecutionEntityRef =
  | "project"
  | "issue"
  | "workflow"
  | "doc"
  | "member"
  | "user";

export interface AiExecutionActionEnumHint {
  value: string;
  aliases: string[];
  description?: string;
}

export interface AiExecutionActionField {
  name: string;
  label: string;
  type: "string" | "string[]" | "enum" | "json" | "date";
  required: boolean;
  description: string;
  options?: string[];
  entityRef?: AiExecutionEntityRef;
  clarifyWhenAmbiguous?: boolean;
  omitWhenUncertain?: boolean;
  examples?: string[];
  enumHints?: AiExecutionActionEnumHint[];
}

export interface AiExecutionActionDefinition {
  key: string;
  label: string;
  description: string;
  area: "project" | "issue" | "workflow" | "doc";
  targetType: "WORKSPACE" | "PROJECT" | "ISSUE" | "WORKFLOW" | "DOC";
  approvalMode: "AUTO" | "CONFIRM";
  requiresTargetId: boolean;
  fields: AiExecutionActionField[];
  sampleInput: Record<string, unknown>;
  availability?: {
    status: AiExecutionAvailabilityStatus;
    reason?: string;
  };
}

export interface AiExecutionCapabilities {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  actorRole: "OWNER" | "ADMIN" | "MEMBER";
  actions: AiExecutionActionDefinition[];
}

export interface AiExecutionManifest {
  workspaceId: string;
  version: number;
  generatedAt: string;
  actions: Array<
    AiExecutionActionDefinition & {
      minimumTeamRole: "MEMBER" | "ADMIN";
      parametersSchema: Record<string, unknown>;
    }
  >;
}

export interface AiExecutionActionResult {
  executionId: string;
  status: "preview" | "succeeded" | "failed" | "blocked";
  needsConfirmation: boolean;
  message: string;
  summary: string;
  targetId: string | null;
  approvalMode: "AUTO" | "CONFIRM";
  action: AiExecutionActionDefinition;
  result?: unknown;
  error?: {
    name?: string;
    message?: string;
    statusCode?: number;
  };
}

export function getAiMessageText(parts: AiMessagePart[]) {
  return parts
    .flatMap((part) => {
      if (part.type === "text") {
        return [part.text];
      }

      if (part.type === "coding-prompt") {
        return [part.prompt];
      }

      if (part.type === "clarification-options") {
        return part.options.map((option) => option.label);
      }

      if (part.type === "error") {
        return [part.message];
      }

      return [];
    })
    .join("\n")
    .trim();
}

export function hasUnsupportedAiParts(parts: AiMessagePart[]) {
  return parts.some(
    (part) =>
      part.type !== "text" &&
      part.type !== "error" &&
      part.type !== "coding-prompt" &&
      part.type !== "clarification-options",
  );
}
