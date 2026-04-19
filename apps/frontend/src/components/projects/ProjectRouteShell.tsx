"use client";

import React from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import AmbientGlow from "@/components/global/AmbientGlow";
import type { Project, ProjectDetail } from "@/lib/fetchers/project";
import {
  buildProjectPath,
  PROJECT_SUBVIEW_ITEMS,
  type ProjectViewMode,
} from "@/components/projects/project-route-utils";

interface ProjectRouteShellProps {
  project: Project | ProjectDetail;
  activeView: ProjectViewMode;
  children: React.ReactNode;
}

function ProjectRouteTabs({
  projectId,
  activeView,
  theme,
}: {
  projectId: string;
  activeView: ProjectViewMode;
  theme: "light" | "dark";
}) {
  const containerClassName =
    theme === "light"
      ? "ml-auto flex flex-wrap gap-2 rounded-full border border-black/[0.06] bg-black/[0.02] p-1"
      : "ml-auto flex flex-wrap gap-2";

  return (
    <div className={containerClassName}>
      {PROJECT_SUBVIEW_ITEMS.map((item) => {
        const href =
          item.id === "overview"
            ? buildProjectPath(projectId)
            : buildProjectPath(projectId, item.id);

        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              theme === "light"
                ? activeView === item.id
                  ? "border-sky-400/26 bg-sky-400/12 text-sky-700 shadow-[0_8px_24px_rgba(56,189,248,0.16)]"
                  : "border-black/[0.06] bg-white/72 text-slate-600 hover:border-black/[0.08] hover:bg-white hover:text-slate-950"
                : activeView === item.id
                  ? "border-sky-500/25 bg-sky-500/12 text-sky-100 shadow-[0_8px_24px_rgba(14,165,233,0.16)]"
                  : "border-app-border/80 bg-app-bg/55 text-app-text-secondary hover:border-app-border hover:bg-app-button-hover/80 hover:text-app-text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function ProjectRouteShell({
  project,
  activeView,
  children,
}: ProjectRouteShellProps) {
  const backHref =
    activeView === "overview" ? "/projects" : buildProjectPath(project.id);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-app-bg">
      <AmbientGlow className="opacity-0 dark:opacity-100" />

      <div className="relative z-10 shrink-0 px-4 pt-5">
        <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-black/[0.06] bg-white/84 px-4 py-3 shadow-[0_24px_72px_-56px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03] backdrop-blur-xl dark:hidden">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-black/[0.12] hover:bg-white hover:text-slate-950"
          >
            <RiArrowLeftLine className="size-6" />
          </Link>

          <div className="min-w-0 pr-2">
            <h1 className="truncate text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              {project.name}
            </h1>
          </div>

          <ProjectRouteTabs
            projectId={project.id}
            activeView={activeView}
            theme="light"
          />
        </div>

        <div className="hidden flex-wrap items-center gap-3 rounded-[26px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-4 py-3 dark:flex">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-full border border-app-border/80 bg-app-bg/70 px-3 py-1.5 text-xs font-medium text-app-text-secondary transition hover:border-app-border hover:bg-app-button-hover hover:text-app-text-primary"
          >
            <RiArrowLeftLine className="size-6" />
          </Link>

          <div className="min-w-0 pr-2">
            <h1 className="truncate text-[1.5rem] font-semibold tracking-[-0.03em] text-app-text-primary">
              {project.name}
            </h1>
          </div>

          <ProjectRouteTabs
            projectId={project.id}
            activeView={activeView}
            theme="dark"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
