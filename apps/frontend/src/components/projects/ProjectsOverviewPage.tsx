"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiArrowRightSLine,
  RiFolder2Line,
  RiLoader4Line,
  RiSearchLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/fetchers/project";
import {
  getProjectRiskMeta,
  getProjectStatusMeta,
  getProjectVisibilityMeta,
  formatShortDate,
  getProjectOwnerLabel,
} from "@/components/projects/project-view-utils";

interface ProjectsOverviewPageProps {
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
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onOpenProject: (projectId: string) => void;
}

export function ProjectsOverviewPage({
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
  onSearchChange,
  onCreate,
  onOpenProject,
}: ProjectsOverviewPageProps) {
  const t = useTranslations("projects");
  const locale = useLocale();
  const visibilityMetaByType = getProjectVisibilityMeta(t);
  const statusMetaByType = getProjectStatusMeta(t);
  const riskMetaByType = getProjectRiskMeta(t);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-app-text-primary">
              {workspaceType === "TEAM"
                ? t("overview.title.team")
                : t("overview.title.personal")}
            </h2>
            <p className="mt-1 text-sm text-app-text-secondary">
              {t("overview.summary", {
                total: projects.length,
                linked: linkedProjectCount,
                empty: emptyProjectCount,
                unassigned: unassignedIssueCount,
              })}
            </p>
          </div>
          <button
            onClick={onCreate}
            disabled={!canManageProjects}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RiAddLine className="size-4" />
            {t("overview.create")}
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-app-border bg-app-content-bg p-3">
          <div className="relative">
            <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-text-muted" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("overview.searchPlaceholder")}
              className="h-11 w-full rounded-2xl border border-app-border bg-app-bg pl-10 pr-4 text-sm text-app-text-primary outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-app-text-muted">
            <span>{t("overview.results", { count: filteredProjects.length })}</span>
            <span className="flex items-center gap-1">
              {isFetching && <RiLoader4Line className="size-3.5 animate-spin" />}
              {t("overview.recentlyUpdated")}
            </span>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-6 py-16 text-center">
            <div className="text-lg font-semibold text-app-text-primary">
              {t("overview.emptyTitle")}
            </div>
            <div className="mt-2 text-sm text-app-text-secondary">
              {t("overview.emptyDescription")}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg cursor-pointer">
            {filteredProjects.map((project) => {
              const visibilityMeta = visibilityMetaByType[project.visibility];
              const statusMeta = statusMetaByType[project.status];
              const riskMeta = riskMetaByType[project.riskLevel];
              const issueCount = issueCountByProject[project.id] || 0;

              return (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="flex w-full items-center gap-4 border-b border-app-border px-4 py-3 text-left transition last:border-b-0 hover:bg-app-button-hover/40 cursor-pointer"
                >
                  <RiFolder2Line className="size-4 shrink-0 text-app-text-secondary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-app-text-primary">
                      {project.name}
                    </div>
                    <div className="mt-1 truncate text-xs text-app-text-muted">
                      {project.brief ||
                        project.description ||
                        t("overview.missingBrief")}
                    </div>
                    <div className="mt-2 hidden flex-wrap items-center gap-2 md:flex">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium",
                          statusMeta.chipClassName,
                        )}
                      >
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium",
                          riskMeta.chipClassName,
                        )}
                      >
                        {riskMeta.icon}
                        {riskMeta.label}
                      </span>
                      {project.phase && (
                        <span className="rounded-full border border-app-border bg-app-bg px-2 py-1 text-[11px] text-app-text-secondary">
                          {project.phase}
                        </span>
                      )}
                      <span className="rounded-full border border-app-border bg-app-bg px-2 py-1 text-[11px] text-app-text-secondary">
                        {getProjectOwnerLabel(project, t)}
                      </span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 md:flex">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium",
                        visibilityMeta.chipClassName,
                      )}
                    >
                      {visibilityMeta.icon}
                      {visibilityMeta.label}
                    </span>
                    <span className="rounded-full border border-app-border bg-app-bg px-2 py-1 text-[11px] text-app-text-secondary">
                      {t("overview.activeIssues", { count: issueCount })}
                    </span>
                    <span className="text-xs text-app-text-muted">
                      {formatShortDate(project.updatedAt, locale)}
                    </span>
                  </div>
                  <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
