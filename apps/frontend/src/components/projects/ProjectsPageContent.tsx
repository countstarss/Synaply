"use client";

import React, {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RiLoader4Line } from "react-icons/ri";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCachedPageVisibility } from "@/components/cache/CachedPageVisibility";
import { ProjectsPageLayout } from "@/components/projects/ProjectsPageLayout";
import { useIssues } from "@/hooks/useIssueApi";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import {
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjectSummary,
  useProjects,
  useUpdateProject,
} from "@/hooks/useProjectApi";
import { useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectBoardState } from "@/components/projects/useProjectBoardState";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import {
  ProjectEditorDialog,
  type ProjectEditorValues,
} from "@/components/projects/ProjectEditorDialog";
import {
  getProjectVisibilityMeta,
} from "@/components/projects/project-view-utils";
import {
  buildProjectPath,
  getProjectViewModeFromPathname,
  getSelectedProjectIdFromPathname,
} from "@/components/projects/project-route-utils";
import CreateIssueModal from "@/components/shared/issue/CreateIssueModal";
import {
  isActiveIssue,
} from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectDetail,
} from "@/lib/fetchers/project";

// MARK: 项目页面内容
export default function ProjectsPageContent() {
  const t = useTranslations("projects");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isSelectionPending, startTransition] = useTransition();
  const isPageVisible = useCachedPageVisibility();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const { data: projects = [], isLoading, error, isFetching } =
    useProjects(workspaceId, { enabled: isPageVisible });
  const { data: allIssues = [] } = useIssues(
    workspaceId,
    {},
    { enabled: isPageVisible, fetchAll: true },
  );
  const { data: teamMembers = [] } = useTeamMembers(currentWorkspace?.teamId, {
    enabled: isPageVisible,
  });

  const currentTeamMember = teamMembers.find(
    (member) =>
      member.user?.id === session?.user?.id || member.userId === session?.user?.id,
  );
  const currentRole = currentTeamMember?.role;
  const canManageProjects =
    workspaceType === "PERSONAL" ||
    currentRole === "OWNER" ||
    currentRole === "ADMIN";

  const selectedProjectId = getSelectedProjectIdFromPathname(pathname);
  const projectViewMode = getProjectViewModeFromPathname(pathname);
  const [selectedProjectIssue, setSelectedProjectIssue] = useState<Issue | null>(
    null,
  );
  useWorkspaceRealtime(workspaceId, {
    enabled: isPageVisible && !selectedProjectIssue,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const {
    issuesViewMode,
    issueBoardCategoryOrder,
    hasUnsavedIssueBoardCategoryOrder,
    setIssuesViewMode,
    handleIssueBoardCategoryOrderChange,
    handleSaveIssueBoardCategoryOrder,
  } = useProjectBoardState({
    workspaceId,
    tProjects: t,
  });

  const deferredSearch = useDeferredValue(searchQuery);
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const detailProjectId = isLoading ? "" : selectedProjectId;
  const { data: selectedProjectDetail, isLoading: isLoadingProjectDetail } =
    useProject(workspaceId, detailProjectId, { enabled: isPageVisible });
  const { data: projectSummary, isLoading: isLoadingProjectSummary } =
    useProjectSummary(workspaceId, detailProjectId, { enabled: isPageVisible });
  const { data: projectIssues = [], isLoading: isLoadingProjectIssues } =
    useIssues(
      workspaceId,
      { projectId: selectedProjectId },
      {
        enabled: isPageVisible && !!selectedProjectId,
        fetchAll: true,
      },
    );

  useEffect(() => {
    if (!workspaceId || !selectedProjectId || isLoading) {
      return;
    }

    const hasSelection = projects.some(
      (project) => project.id === selectedProjectId,
    );

    if (!hasSelection) {
      router.replace("/projects");
    }
  }, [isLoading, projects, router, selectedProjectId, workspaceId]);

  useEffect(() => {
    setSelectedProjectIssue(null);
  }, [selectedProjectId, workspaceId]);

  useEffect(() => {
    if (searchParams.get("intent") !== "create-project") {
      return;
    }

    if (!workspaceId || isLoading || isProjectDialogOpen || selectedProjectId) {
      return;
    }

    if (!canManageProjects) {
      router.replace("/projects");
      return;
    }

    openCreateDialog();
    router.replace("/projects");
  }, [
    canManageProjects,
    isLoading,
    isProjectDialogOpen,
    router,
    searchParams,
    selectedProjectId,
    workspaceId,
  ]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const projectVisibilityMeta = getProjectVisibilityMeta(t);
  const filteredProjects = [...projects]
    .filter((project) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        project.name,
        project.description || "",
        project.brief || "",
        project.phase || "",
        project.status,
        project.riskLevel,
        project.owner?.user?.name || "",
        project.owner?.user?.email || "",
        project.visibility,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );

  const issueCountByProject = allIssues.reduce<Record<string, number>>(
    (counts, issue) => {
      if (!issue.projectId || !isActiveIssue(issue)) {
        return counts;
      }

      counts[issue.projectId] = (counts[issue.projectId] || 0) + 1;
      return counts;
    },
    {},
  );

  const linkedProjectCount = Object.keys(issueCountByProject).length;
  const unassignedIssueCount = allIssues.filter(
    (issue) => !issue.projectId && isActiveIssue(issue),
  ).length;
  const emptyProjectCount = Math.max(projects.length - linkedProjectCount, 0);

  const selectedProject =
    projectSummary?.project ||
    selectedProjectDetail ||
    projects.find((project) => project.id === selectedProjectId) ||
    null;
  const selectedProjectWorkspaceName =
    projectSummary?.project.workspace?.name ||
    selectedProjectDetail?.workspace?.name ||
    currentWorkspace?.name ||
    "";
  const selectedProjectVisibility = selectedProject
    ? projectVisibilityMeta[selectedProject.visibility]
    : null;
  const relatedWorkflows = projectSummary?.workflows ?? [];
  const recentActivity = projectSummary?.recentActivity ?? [];

  const openCreateDialog = () => {
    setProjectDialogMode("create");
    setEditingProject(null);
    setIsProjectDialogOpen(true);
  };

  const openEditDialog = (project: Project | ProjectDetail) => {
    setProjectDialogMode("edit");
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const handleProjectSubmit = async (values: ProjectEditorValues) => {
    if (!workspaceId) {
      toast.error(t("toasts.workspaceRequired"));
      return;
    }

    if (projectDialogMode === "create") {
      createProjectMutation.mutate(
        {
          workspaceId,
          data: values,
        },
        {
          onSuccess: (createdProject) => {
            setIsProjectDialogOpen(false);
            startTransition(() => {
              router.push(buildProjectPath(createdProject.id));
            });
            toast.success(t("toasts.created"));
          },
          onError: (submitError) => {
            toast.error(
              submitError instanceof Error
                ? submitError.message
                : t("toasts.saveFailed"),
            );
          },
        },
      );
      return;
    }

    try {
      if (editingProject) {
        const updatedProject = await updateProjectMutation.mutateAsync({
          workspaceId,
          projectId: editingProject.id,
          data: values,
        });

        startTransition(() => {
          router.push(buildProjectPath(updatedProject.id));
        });
        toast.success(t("toasts.updated"));
      }

      setIsProjectDialogOpen(false);
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : t("toasts.saveFailed"),
      );
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!workspaceId) {
      toast.error(t("toasts.workspaceRequired"));
      return;
    }

    try {
      const deletedResult = await deleteProjectMutation.mutateAsync({
        workspaceId,
        projectId: project.id,
      });

      startTransition(() => {
        if (project.id === selectedProjectId) {
          router.push("/projects");
        }
      });
      setProjectToDelete(null);
      toast.success(
        t("toasts.deleted", {
          issueCount: deletedResult.deletedIssueCount,
          docCount: deletedResult.deletedDocCount,
          folderCount: deletedResult.deletedFolderCount,
        }),
      );
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : t("toasts.deleteFailed"),
      );
    }
  };

  const handleOpenIssue = (issue: Issue) => {
    if (!selectedProjectId && !issue.projectId) {
      toast.error(t("toasts.invalidIssueRoute"));
      return;
    }

    queryClient.setQueryData<Issue>(["issue", workspaceId, issue.id], issue);
    setSelectedProjectIssue(issue);
  };

  const invalidateIssues = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleMarkSync = (projectId: string) => {
    updateProjectMutation.mutate(
      {
        workspaceId,
        projectId,
        data: {
          lastSyncAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success(t("toasts.syncUpdated"));
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("toasts.syncFailed"),
          );
        },
      },
    );
  };

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-app-text-primary">
            {t("page.selectWorkspaceTitle")}
          </h2>
          <p className="mt-2 text-sm text-app-text-secondary">
            {t("page.selectWorkspaceDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="flex items-center gap-2 text-app-text-secondary">
          <RiLoader4Line className="size-5 animate-spin" />
          {t("page.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-app-text-primary">
            {t("page.loadFailedTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-text-secondary">
            {error.message || t("page.loadFailedDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProjectsPageLayout
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        projects={projects}
        filteredProjects={filteredProjects}
        issueCountByProject={issueCountByProject}
        linkedProjectCount={linkedProjectCount}
        emptyProjectCount={emptyProjectCount}
        unassignedIssueCount={unassignedIssueCount}
        canManageProjects={canManageProjects}
        isFetching={isFetching}
        searchQuery={searchQuery}
        selectedProjectId={selectedProjectId}
        selectedProjectIssue={selectedProjectIssue}
        selectedProject={selectedProject}
        selectedProjectWorkspaceName={selectedProjectWorkspaceName}
        selectedProjectVisibilityLabel={
          selectedProjectVisibility?.label || selectedProject?.visibility || ""
        }
        projectSummary={projectSummary}
        projectViewMode={projectViewMode}
        relatedWorkflows={relatedWorkflows}
        recentActivity={recentActivity}
        projectIssues={projectIssues}
        currentTeamMemberId={currentTeamMember?.id}
        currentUserId={session?.user?.id}
        isSelectionPending={isSelectionPending}
        isLoadingProjectDetail={
          isLoadingProjectDetail || isLoadingProjectSummary
        }
        issuesViewMode={issuesViewMode}
        issueBoardCategoryOrder={issueBoardCategoryOrder}
        hasUnsavedIssueBoardCategoryOrder={hasUnsavedIssueBoardCategoryOrder}
        isLoadingProjectIssues={isLoadingProjectIssues}
        isMarkingSync={updateProjectMutation.isPending}
        onSearchChange={setSearchQuery}
        onCreateProject={openCreateDialog}
        onOpenProject={(projectId) =>
          startTransition(() => {
            router.push(buildProjectPath(projectId));
          })
        }
        onInvalidateIssues={invalidateIssues}
        onCreateIssue={() => setIsCreateIssueOpen(true)}
        onOpenIssue={handleOpenIssue}
        onEditProject={() => selectedProject && openEditDialog(selectedProject)}
        onDeleteProject={() => selectedProject && setProjectToDelete(selectedProject)}
        onMarkSync={() => selectedProject && handleMarkSync(selectedProject.id)}
        onBackToOverview={() => router.push("/projects")}
        onProjectIssuesViewModeChange={setIssuesViewMode}
        onIssueBoardCategoryOrderChange={handleIssueBoardCategoryOrderChange}
        onSaveIssueBoardCategoryOrder={handleSaveIssueBoardCategoryOrder}
        onCloseIssueDetail={() => setSelectedProjectIssue(null)}
      />

      <ProjectEditorDialog
        open={isProjectDialogOpen}
        mode={projectDialogMode}
        workspaceType={workspaceType}
        initialProject={editingProject}
        teamMembers={teamMembers}
        defaultOwnerMemberId={currentTeamMember?.id}
        isPending={
          createProjectMutation.isPending || updateProjectMutation.isPending
        }
        onOpenChange={setIsProjectDialogOpen}
        onSubmit={handleProjectSubmit}
      />

      <DeleteProjectDialog
        open={!!projectToDelete}
        workspaceId={workspaceId}
        project={projectToDelete}
        isDeleting={deleteProjectMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setProjectToDelete(null);
          }
        }}
        onConfirm={handleDeleteProject}
      />

      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        onCreated={() => {}}
        initialProjectId={selectedProject?.id}
        projectContextName={selectedProject?.name}
      />

    </>
  );
}
