import { getBackendBaseUrl } from "@/lib/backend-url";
import { VisibilityType } from "@/types/prisma";

const API_BASE_URL = getBackendBaseUrl();

export type DocContext = "personal" | "team" | "team-personal";
export type DocVisibility = VisibilityType;
export type DocKind =
  | "GENERAL"
  | "PROJECT_BRIEF"
  | "DECISION_LOG"
  | "REVIEW_PACKET"
  | "HANDOFF_PACKET"
  | "RELEASE_CHECKLIST";

export interface DocRecord {
  id: string;
  _id: string;
  title: string;
  type: "document" | "folder";
  kind: DocKind;
  templateKey?: string;
  content?: string;
  description?: string;
  creatorId: string;
  creatorMemberId: string;
  ownerMemberId: string;
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  projectId?: string;
  issueId?: string;
  workflowId?: string;
  parentDocument?: string;
  visibility: DocVisibility;
  isArchived: boolean;
  isDeleted: boolean;
  icon?: string;
  coverImage?: string;
  order: number;
  latestRevisionId?: string;
  createdAt: number;
  updatedAt: number;
  lastEditedAt: number;
  isProjectRootFolder?: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface QueryDocsTreeParams {
  context?: DocContext;
  workspaceType?: "PERSONAL" | "TEAM";
  projectId?: string;
  issueId?: string;
  workflowId?: string;
  includeArchived?: boolean;
}

export interface CreateDocInput {
  title: string;
  content?: string;
  kind?: DocKind;
  templateKey?: string;
  parentDocument?: string;
  projectId?: string;
  issueId?: string;
  workflowId?: string;
  visibility?: DocVisibility;
  order?: number;
}

export interface CreateFolderInput {
  title: string;
  description?: string;
  parentDocument?: string;
  projectId?: string;
  issueId?: string;
  workflowId?: string;
  visibility?: DocVisibility;
  order?: number;
}

export interface UpdateDocMetaInput {
  title?: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  kind?: DocKind;
  templateKey?: string;
  visibility?: DocVisibility;
}

export interface CreateDocRevisionInput {
  clientMutationId: string;
  baseRevisionId?: string;
  contentSnapshot: string;
  metadataSnapshot?: string;
  changeSource?: "CREATE" | "EDITOR" | "META" | "SYSTEM" | "IMPORT";
}

export type DocRevisionMutationResult =
  | {
      status: "applied" | "noop";
      revisionId?: string | null;
      doc: DocRecord;
    }
  | {
      status: "conflict";
      revisionId?: string | null;
      doc: DocRecord;
      serverRevisionId?: string | null;
      serverSnapshot?: string | null;
      serverMetadataSnapshot?: string | null;
    };

async function fetchDocApi<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "文档请求失败";

    try {
      const errorData = await response.json();
      message =
        errorData?.message ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : message);
    } catch {
      const errorText = await response.text().catch(() => "");
      message = errorText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

function normalizeOptionalId(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

type SanitizableDocPayload = {
  parentDocument?: string;
  projectId?: string;
  issueId?: string;
  workflowId?: string;
  baseRevisionId?: string;
};

function sanitizeDocPayload<T extends SanitizableDocPayload>(data: T): T {
  return {
    ...data,
    parentDocument: normalizeOptionalId(data.parentDocument as string | undefined),
    projectId: normalizeOptionalId(data.projectId as string | undefined),
    issueId: normalizeOptionalId(data.issueId as string | undefined),
    workflowId: normalizeOptionalId(data.workflowId as string | undefined),
    baseRevisionId: normalizeOptionalId(data.baseRevisionId as string | undefined),
  };
}

function buildDocsQuery(params: QueryDocsTreeParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.context) {
    searchParams.set("context", params.context);
  }

  if (params.workspaceType) {
    searchParams.set("workspaceType", params.workspaceType);
  }

  const projectId = normalizeOptionalId(params.projectId);
  if (projectId) {
    searchParams.set("projectId", projectId);
  }

  const issueId = normalizeOptionalId(params.issueId);
  if (issueId) {
    searchParams.set("issueId", issueId);
  }

  const workflowId = normalizeOptionalId(params.workflowId);
  if (workflowId) {
    searchParams.set("workflowId", workflowId);
  }

  if (params.includeArchived) {
    searchParams.set("includeArchived", "true");
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getDocsTree(
  workspaceId: string,
  token: string,
  params: QueryDocsTreeParams = {}
): Promise<DocRecord[]> {
  return fetchDocApi<DocRecord[]>(
    `/workspaces/${workspaceId}/docs/tree${buildDocsQuery(params)}`,
    token
  );
}

export async function createDoc(
  workspaceId: string,
  data: CreateDocInput,
  token: string
): Promise<DocRecord> {
  return fetchDocApi<DocRecord>(`/workspaces/${workspaceId}/docs`, token, {
    method: "POST",
    body: JSON.stringify(sanitizeDocPayload(data)),
  });
}

export async function createFolder(
  workspaceId: string,
  data: CreateFolderInput,
  token: string
): Promise<DocRecord> {
  return fetchDocApi<DocRecord>(
    `/workspaces/${workspaceId}/docs/folders`,
    token,
    {
      method: "POST",
      body: JSON.stringify(sanitizeDocPayload(data)),
    }
  );
}

export async function updateDocMeta(
  workspaceId: string,
  docId: string,
  data: UpdateDocMetaInput,
  token: string
): Promise<DocRecord> {
  return fetchDocApi<DocRecord>(
    `/workspaces/${workspaceId}/docs/${docId}/meta`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function createDocRevision(
  workspaceId: string,
  docId: string,
  data: CreateDocRevisionInput,
  token: string
): Promise<DocRevisionMutationResult> {
  return fetchDocApi<DocRevisionMutationResult>(
    `/workspaces/${workspaceId}/docs/${docId}/revisions`,
    token,
    {
      method: "POST",
      body: JSON.stringify(sanitizeDocPayload(data)),
    }
  );
}

export async function deleteDoc(
  workspaceId: string,
  docId: string,
  token: string
): Promise<DocRecord> {
  return fetchDocApi<DocRecord>(`/workspaces/${workspaceId}/docs/${docId}`, token, {
    method: "DELETE",
  });
}
