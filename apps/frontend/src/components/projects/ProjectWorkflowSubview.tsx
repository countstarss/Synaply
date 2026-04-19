"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RiArrowRightLine } from "react-icons/ri";
import { Link } from "@/i18n/navigation";
import type { ProjectWorkflowSummary } from "@/lib/fetchers/project";
import { ProjectSurfaceCard } from "@/components/projects/ProjectSurfaceCard";

export function ProjectWorkflowSubview({
  relatedWorkflows,
}: {
  relatedWorkflows: ProjectWorkflowSummary[];
}) {
  const tProjects = useTranslations("projects");

  return (
    <div className="flex h-full min-h-0 flex-col p-4 isolate">
      <ProjectSurfaceCard
        title={tProjects("subviews.workflow.title")}
        subtitle={tProjects("subviews.workflow.subtitle")}
        action={
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
          >
            {tProjects("subviews.workflow.openCenter")}
            <RiArrowRightLine className="size-3.5" />
          </Link>
        }
      >
        {relatedWorkflows.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-bg/60 px-4 py-8 text-sm text-app-text-secondary">
            {tProjects("subviews.workflow.empty")}
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {relatedWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-app-text-primary">
                        {workflow.name}
                      </div>
                      <div className="mt-1 text-xs text-app-text-secondary">
                        {tProjects("subviews.workflow.linkedIssues", {
                          count: workflow.issueCount,
                          status: workflow.status,
                        })}
                      </div>
                    </div>
                    <div className="rounded-full border border-app-border bg-app-content-bg px-2 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("subviews.workflow.steps", {
                        count: workflow.totalSteps,
                      })}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-app-text-secondary">
                    <div className="rounded-xl border border-app-border bg-app-content-bg/80 px-3 py-2">
                      {tProjects("subviews.workflow.version")} ·{" "}
                      {workflow.version || tProjects("subviews.workflow.notAvailable")}
                    </div>
                    <div className="rounded-xl border border-app-border bg-app-content-bg/80 px-3 py-2">
                      {tProjects("subviews.workflow.visibility")} · {workflow.visibility}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProjectSurfaceCard>
    </div>
  );
}
