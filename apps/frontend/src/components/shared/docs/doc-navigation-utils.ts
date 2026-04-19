import { buildProjectPath } from "../../projects/project-route-utils";

export type DocRouteContext = "personal" | "team" | "team-personal";
export type DocRouteWorkspaceType = "PERSONAL" | "TEAM";

interface BuildDocStorageKeyOptions {
  workspaceId: string;
  workspaceType: DocRouteWorkspaceType;
  context: DocRouteContext;
  projectId?: string | null;
}

interface ResolveDocHrefOptions {
  context: DocRouteContext;
  projectId?: string | null;
}

function normalizeOptionalId(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function buildDocStorageKey(options: BuildDocStorageKeyOptions) {
  const { workspaceId, workspaceType, context, projectId } = options;
  const normalizedProjectId = normalizeOptionalId(projectId);

  return `docs-open-${workspaceId}-${workspaceType}-${context}${
    normalizedProjectId ? `-${normalizedProjectId}` : ""
  }`;
}

export function resolveDocHref(options: ResolveDocHrefOptions) {
  const { context, projectId } = options;
  const normalizedProjectId = normalizeOptionalId(projectId);

  if (normalizedProjectId) {
    const projectDocsHref = buildProjectPath(normalizedProjectId, "docs");

    return context === "team-personal"
      ? `${projectDocsHref}?context=team-personal`
      : projectDocsHref;
  }

  return context === "team-personal" ? "/personal/doc" : "/docs";
}

export function resolveProjectDocsContext(
  workspaceType: DocRouteWorkspaceType,
  requestedContext?: string | null,
): DocRouteContext {
  if (workspaceType === "PERSONAL") {
    return "personal";
  }

  return requestedContext === "team-personal" ? "team-personal" : "team";
}
