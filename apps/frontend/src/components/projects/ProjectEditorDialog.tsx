"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RiFolder2Line, RiSparklingLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Project,
  ProjectVisibility,
  getDefaultProjectVisibility,
} from "@/lib/fetchers/project";
import type { TeamMember } from "@/lib/fetchers/team";
import {
  getProjectRiskMeta,
  getProjectStatusMeta,
  getProjectVisibilityMeta,
} from "@/components/projects/project-view-utils";
import {
  ProjectRiskLevel,
  ProjectStatus,
  VisibilityType,
} from "@/types/prisma";

export interface ProjectEditorValues {
  name: string;
  description?: string;
  brief?: string;
  status: ProjectStatus;
  phase?: string;
  riskLevel: ProjectRiskLevel;
  ownerMemberId?: string;
  visibility: ProjectVisibility;
}

interface ProjectEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  workspaceType: "PERSONAL" | "TEAM";
  initialProject?: Project | null;
  teamMembers?: TeamMember[];
  defaultOwnerMemberId?: string | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProjectEditorValues) => void | Promise<void>;
}

export function ProjectEditorDialog({
  open,
  mode,
  workspaceType,
  initialProject,
  teamMembers = [],
  defaultOwnerMemberId,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ProjectEditorDialogProps) {
  const tProjects = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [phase, setPhase] = useState("");
  const [riskLevel, setRiskLevel] = useState<ProjectRiskLevel>(
    ProjectRiskLevel.LOW,
  );
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>(
    getDefaultProjectVisibility(workspaceType),
  );
  const projectStatusMeta = getProjectStatusMeta(tProjects);
  const projectRiskMeta = getProjectRiskMeta(tProjects);
  const projectVisibilityMeta = getProjectVisibilityMeta(tProjects);
  const projectStatusOptions = [
    ProjectStatus.PLANNING,
    ProjectStatus.ACTIVE,
    ProjectStatus.BLOCKED,
    ProjectStatus.SHIPPING,
    ProjectStatus.DONE,
    ProjectStatus.ARCHIVED,
  ];
  const projectRiskOptions = [
    ProjectRiskLevel.LOW,
    ProjectRiskLevel.MEDIUM,
    ProjectRiskLevel.HIGH,
    ProjectRiskLevel.CRITICAL,
  ];
  const projectVisibilityOptions = [
    VisibilityType.PRIVATE,
    VisibilityType.TEAM_READONLY,
    VisibilityType.TEAM_EDITABLE,
    VisibilityType.PUBLIC,
  ] as const satisfies ProjectVisibility[];

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialProject?.name ?? "");
    setDescription(initialProject?.description ?? "");
    setBrief(initialProject?.brief ?? "");
    setStatus(initialProject?.status ?? ProjectStatus.ACTIVE);
    setPhase(initialProject?.phase ?? "");
    setRiskLevel(initialProject?.riskLevel ?? ProjectRiskLevel.LOW);
    setOwnerMemberId(
      initialProject?.ownerMemberId ?? defaultOwnerMemberId ?? "",
    );
    setVisibility(
      initialProject?.visibility ?? getDefaultProjectVisibility(workspaceType),
    );
  }, [defaultOwnerMemberId, initialProject, open, workspaceType]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      brief: brief.trim() || undefined,
      status,
      phase: phase.trim() || undefined,
      riskLevel,
      ownerMemberId: ownerMemberId || undefined,
      visibility,
    });
  };

  const title =
    mode === "create"
      ? tProjects("editor.title.create")
      : tProjects("editor.title.edit");
  const subtitle =
    mode === "create"
      ? tProjects("editor.subtitle.create")
      : tProjects("editor.subtitle.edit");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl border-app-border bg-app-content-bg p-0 shadow-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-app-border px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-app-text-primary">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-app-border bg-app-bg text-app-text-primary">
              {mode === "create" ? (
                <RiSparklingLine className="size-5" />
              ) : (
                <RiFolder2Line className="size-5" />
              )}
            </span>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-app-text-secondary">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tProjects("editor.fields.name")}
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={tProjects("editor.fields.namePlaceholder")}
                className="border-app-border bg-app-bg text-app-text-primary"
                autoFocus
                maxLength={100}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tProjects("editor.fields.brief")}
              </label>
              <Input
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder={tProjects("editor.fields.briefPlaceholder")}
                className="border-app-border bg-app-bg text-app-text-primary"
                maxLength={240}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tProjects("editor.fields.description")}
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={tProjects("editor.fields.descriptionPlaceholder")}
                className="min-h-28 border-app-border bg-app-bg text-app-text-primary"
                maxLength={500}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-app-text-primary">
                  {tProjects("editor.fields.status")}
                </label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ProjectStatus)}
                >
                  <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                    <SelectValue
                      placeholder={tProjects("editor.fields.statusPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    {projectStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {projectStatusMeta[option].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-app-text-primary">
                  {tProjects("editor.fields.phase")}
                </label>
                <Input
                  value={phase}
                  onChange={(event) => setPhase(event.target.value)}
                  placeholder={tProjects("editor.fields.phasePlaceholder")}
                  className="border-app-border bg-app-bg text-app-text-primary"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-app-text-primary">
                  {tProjects("editor.fields.risk")}
                </label>
                <Select
                  value={riskLevel}
                  onValueChange={(value) =>
                    setRiskLevel(value as ProjectRiskLevel)
                  }
                >
                  <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                    <SelectValue
                      placeholder={tProjects("editor.fields.riskPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    {projectRiskOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {projectRiskMeta[option].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {teamMembers.length > 0 ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-app-text-primary">
                    {tProjects("editor.fields.owner")}
                  </label>
                  <Select
                    value={ownerMemberId}
                    onValueChange={(value) => setOwnerMemberId(value)}
                  >
                    <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                      <SelectValue
                        placeholder={tProjects("editor.fields.ownerPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent className="border-app-border bg-app-content-bg">
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user.name || member.user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium text-app-text-primary">
                {tProjects("editor.fields.visibility")}
              </label>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as ProjectVisibility)
                }
              >
                <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue
                    placeholder={tProjects(
                      "editor.fields.visibilityPlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {projectVisibilityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {projectVisibilityMeta[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-app-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 text-white hover:bg-sky-500"
              disabled={isPending || !name.trim()}
            >
              {isPending
                ? mode === "create"
                  ? tProjects("editor.actions.creating")
                  : tProjects("editor.actions.saving")
                : mode === "create"
                  ? tProjects("editor.actions.create")
                  : tProjects("editor.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
