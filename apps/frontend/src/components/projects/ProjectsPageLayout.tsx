"use client";

import React from "react";
import AmbientGlow from "@/components/global/AmbientGlow";
import IssueDetailPageSurface from "@/components/issue/IssueDetailPageSurface";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import { ProjectRouteShell } from "@/components/projects/ProjectRouteShell";
import {
  ProjectDocsSubview,
  ProjectIssuesSubview,
  ProjectSyncSubview,
  ProjectWorkflowSubview,
} from "@/components/projects/ProjectSubviewContent";
import { ProjectsEmptyState } from "@/components/projects/ProjectsEmptyState";
import { ProjectsOverviewPage } from "@/components/projects/ProjectsOverviewPage";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectActivityItem,
  ProjectDetail,
  ProjectSummary,
  ProjectWorkflowSummary,
} from "@/lib/fetchers/project";
import { IssueStateCategory } from "@/types/prisma";

export function ProjectsPageLayout({
  workspaceId,
  workspaceType,
  projects,
  filteredProjects,
  issueCountByProject,
  linkedProjectCount,
  emptyProjectCount,
  unassignedIssueCount,
  canManageProjects,
  isFetching,
  searchQuery,
  selectedProjectId,
  selectedProjectIssueId,
  selectedProject,
  selectedProjectWorkspaceName,
  selectedProjectVisibilityLabel,
  projectSummary,
  projectViewMode,
  relatedWorkflows,
  recentActivity,
  projectIssues,
  currentTeamMemberId,
  currentUserId,
  isSelectionPending,
  isLoadingProjectDetail,
  issuesViewMode,
  issueBoardCategoryOrder,
  hasUnsavedIssueBoardCategoryOrder,
  isLoadingProjectIssues,
  isMarkingSync,
  onSearchChange,
  onCreateProject,
  onOpenProject,
  onInvalidateIssues,
  onCreateIssue,
  onOpenIssue,
  onEditProject,
  onDeleteProject,
  onMarkSync,
  onBackToOverview,
  onProjectIssuesViewModeChange,
  onIssueBoardCategoryOrderChange,
  onSaveIssueBoardCategoryOrder,
  onCloseIssueDetail,
}: {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  projects: Project[];
  filteredProjects: Project[];
  issueCountByProject: Record<string, number>;
  linkedProjectCount: number;
  emptyProjectCount: number;
  unassignedIssueCount: number;
  canManageProjects: boolean;
  isFetching: boolean;
  searchQuery: string;
  selectedProjectId: string | null;
  selectedProjectIssueId: string | null;
  selectedProject: Project | ProjectDetail | null;
  selectedProjectWorkspaceName: string;
  selectedProjectVisibilityLabel: string;
  projectSummary?: ProjectSummary;
  projectViewMode: "overview" | "issues" | "docs" | "workflow" | "sync";
  relatedWorkflows: ProjectWorkflowSummary[];
  recentActivity: ProjectActivityItem[];
  projectIssues: Issue[];
  currentTeamMemberId?: string;
  currentUserId?: string;
  isSelectionPending: boolean;
  isLoadingProjectDetail: boolean;
  issuesViewMode: "list" | "board";
  issueBoardCategoryOrder: IssueStateCategory[];
  hasUnsavedIssueBoardCategoryOrder: boolean;
  isLoadingProjectIssues: boolean;
  isMarkingSync: boolean;
  onSearchChange: (value: string) => void;
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
  onInvalidateIssues: () => void;
  onCreateIssue: () => void;
  onOpenIssue: (issue: Issue) => void;
  onEditProject: () => void;
  onDeleteProject: () => void;
  onMarkSync: () => void;
  onBackToOverview: () => void;
  onProjectIssuesViewModeChange: (mode: "list" | "board") => void;
  onIssueBoardCategoryOrderChange: (order: IssueStateCategory[]) => void;
  onSaveIssueBoardCategoryOrder: () => void;
  onCloseIssueDetail: () => void;
}) {
  if (selectedProjectId && selectedProjectIssueId) {
    return (
      <div className="h-full w-full bg-transparent">
        <IssueDetailPageSurface
          issueId={selectedProjectIssueId}
          workspaceId={workspaceId}
          onClose={onCloseIssueDetail}
          onUpdate={onInvalidateIssues}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-app-bg">
      <AmbientGlow />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {!projects.length ? (
          <ProjectsEmptyState canManageProjects={canManageProjects} onCreate={onCreateProject} />
        ) : !selectedProject ? (
          <ProjectsOverviewPage
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
            onSearchChange={onSearchChange}
            onCreate={onCreateProject}
            onOpenProject={onOpenProject}
          />
        ) : (
          <ProjectRouteShell project={selectedProject} activeView={projectViewMode}>
            {projectViewMode === "issues" ? (
              <ProjectIssuesSubview
                workspaceId={workspaceId}
                projectIssues={projectIssues}
                issuesViewMode={issuesViewMode}
                issueBoardCategoryOrder={issueBoardCategoryOrder}
                isLoadingProjectIssues={isLoadingProjectIssues}
                hasUnsavedIssueBoardCategoryOrder={hasUnsavedIssueBoardCategoryOrder}
                currentTeamMemberId={currentTeamMemberId}
                onCreateIssue={onCreateIssue}
                onOpenIssue={onOpenIssue}
                onIssueBoardCategoryOrderChange={onIssueBoardCategoryOrderChange}
                onSaveIssueBoardCategoryOrder={onSaveIssueBoardCategoryOrder}
                onIssuesViewModeChange={onProjectIssuesViewModeChange}
              />
            ) : projectViewMode === "docs" ? (
              <ProjectDocsSubview
                workspaceId={workspaceId}
                workspaceType={workspaceType}
                currentUserId={currentUserId}
                projectId={selectedProject.id}
              />
            ) : projectViewMode === "workflow" ? (
              <ProjectWorkflowSubview relatedWorkflows={relatedWorkflows} />
            ) : projectViewMode === "sync" ? (
              <ProjectSyncSubview
                workspaceId={workspaceId}
                workspaceType={workspaceType}
                selectedProject={selectedProject}
                recentActivity={recentActivity}
                projectIssues={projectIssues}
                onMarkSync={onMarkSync}
                isMarkingSync={isMarkingSync}
                onOpenIssue={onOpenIssue}
              />
            ) : (
              <ProjectDetailView
                workspaceId={workspaceId}
                selectedProject={selectedProject}
                workspaceType={workspaceType}
                workspaceName={selectedProjectWorkspaceName}
                visibilityLabel={selectedProjectVisibilityLabel}
                currentUserId={currentUserId}
                projectSummary={projectSummary}
                projectIssues={projectIssues}
                isSelectionPending={isSelectionPending}
                isLoadingProjectDetail={isLoadingProjectDetail}
                canManageProjects={canManageProjects}
                onBack={onBackToOverview}
                onCreateIssue={onCreateIssue}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
                onOpenIssue={onOpenIssue}
                onMarkSync={onMarkSync}
                isMarkingSync={isMarkingSync}
                showBackButton={false}
              />
            )}
          </ProjectRouteShell>
        )}
      </div>
    </div>
  );
}
