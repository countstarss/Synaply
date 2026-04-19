"use client";

export const PROJECT_SUBVIEW_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "issues", label: "Issues" },
  { id: "docs", label: "Docs" },
  { id: "workflow", label: "Workflow" },
  { id: "sync", label: "Sync" },
] as const;

export type ProjectSubview = Exclude<
  (typeof PROJECT_SUBVIEW_ITEMS)[number]["id"],
  "overview"
>;

export type ProjectViewMode =
  (typeof PROJECT_SUBVIEW_ITEMS)[number]["id"];

const PROJECT_SUBVIEW_SET = new Set<ProjectSubview>([
  "issues",
  "docs",
  "workflow",
  "sync",
]);

const getProjectsSegmentIndex = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  return {
    segments,
    projectsSegmentIndex: segments.indexOf("projects"),
  };
};

export const getSelectedProjectIdFromPathname = (pathname: string) => {
  const { segments, projectsSegmentIndex } = getProjectsSegmentIndex(pathname);

  if (projectsSegmentIndex === -1) {
    return "";
  }

  return decodeURIComponent(segments[projectsSegmentIndex + 1] || "");
};

export const getProjectViewModeFromPathname = (
  pathname: string,
): ProjectViewMode => {
  const { segments, projectsSegmentIndex } = getProjectsSegmentIndex(pathname);

  if (projectsSegmentIndex === -1) {
    return "overview";
  }

  const candidate = segments[projectsSegmentIndex + 2];

  if (candidate && PROJECT_SUBVIEW_SET.has(candidate as ProjectSubview)) {
    return candidate as ProjectSubview;
  }

  return "overview";
};

export const getProjectIssueIdFromPathname = (pathname: string) => {
  const { segments, projectsSegmentIndex } = getProjectsSegmentIndex(pathname);

  if (projectsSegmentIndex === -1) {
    return "";
  }

  const candidate = segments[projectsSegmentIndex + 2];

  if (!candidate || PROJECT_SUBVIEW_SET.has(candidate as ProjectSubview)) {
    return "";
  }

  return decodeURIComponent(candidate);
};

export const buildProjectPath = (
  projectId: string,
  subview?: ProjectSubview,
) => {
  const encodedProjectId = encodeURIComponent(projectId);

  if (!subview) {
    return `/projects/${encodedProjectId}`;
  }

  return `/projects/${encodedProjectId}/${subview}`;
};

export const buildProjectIssuePath = (projectId: string, issueId: string) =>
  `/projects/${encodeURIComponent(projectId)}/${encodeURIComponent(issueId)}`;
