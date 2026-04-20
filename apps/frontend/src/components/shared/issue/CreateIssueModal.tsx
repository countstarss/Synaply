"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { RiCloseLine, RiFlowChart } from "react-icons/ri";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IssueDescriptionTemplateAction } from "@/components/shared/issue/IssueDescriptionTemplateAction";
import { IssueMemberMultiSelect } from "@/components/shared/issue/IssueMemberMultiSelect";
import { useCreateIssue, useCreateWorkflowIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkflows } from "@/hooks/useWorkflowApi";
import type { CreateIssueDto } from "@/lib/fetchers/issue";
import type { TeamMember } from "@/lib/fetchers/team";
import type { WorkflowResponse } from "@/lib/fetchers/workflow";
import { resolveIssueStateForCategory } from "@/lib/issue-board";
import { cn } from "@/lib/utils";
import {
  IssuePriority,
  IssueStateCategory,
  VisibilityType,
} from "@/types/prisma";
import type { Workflow } from "@/types/team";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialProjectId?: string;
  projectContextName?: string;
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
}

const NONE_VALUE = "__none__";
const DEFAULT_PRIORITY_VALUE = "__default_priority__";

function getDefaultVisibility(workspaceType: "PERSONAL" | "TEAM") {
  return workspaceType === "TEAM"
    ? VisibilityType.TEAM_EDITABLE
    : VisibilityType.PRIVATE;
}

function getVisibilityOptions(
  workspaceType: "PERSONAL" | "TEAM",
  t: (key: string) => string,
) {
  if (workspaceType === "TEAM") {
    return [
      { value: VisibilityType.PRIVATE, label: t("visibility.private") },
      { value: VisibilityType.TEAM_READONLY, label: t("visibility.teamReadonly") },
      { value: VisibilityType.TEAM_EDITABLE, label: t("visibility.teamEditable") },
    ];
  }

  return [
    { value: VisibilityType.PRIVATE, label: t("visibility.private") },
    { value: VisibilityType.PUBLIC, label: t("visibility.public") },
  ];
}

function getTeamMemberName(member: TeamMember) {
  return (
    member.user.name?.trim() ||
    member.user.email?.split("@")[0] ||
    `Member ${member.id.slice(0, 6)}`
  );
}

export default function CreateIssueModal({
  isOpen,
  onClose,
  onCreated,
  initialProjectId,
  projectContextName,
}: CreateIssueModalProps) {
  const locale = useLocale();
  const t = useTranslations("issues");
  const tCommon = useTranslations("common");
  const { session, user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const teamId = currentWorkspace?.teamId;
  const currentUserLabel =
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    tCommon("states.currentUser");

  const [issueType, setIssueType] = useState<"normal" | "workflow">("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [selectedStateCategory, setSelectedStateCategory] = useState<
    IssueStateCategory | ""
  >("");
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority | "">("");
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityType>(
    getDefaultVisibility(workspaceType),
  );
  const [directAssigneeId, setDirectAssigneeId] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const { data: workflowResponses = [], isLoading: isLoadingWorkflows } =
    useWorkflows(workspaceId);
  const { data: projects = [], isLoading: isLoadingProjects } =
    useProjects(workspaceId);
  const { data: issueStates = [], isLoading: isLoadingIssueStates } =
    useIssueStates(workspaceId, { enabled: isOpen });
  const { data: teamMembers = [] } = useTeamMembers(teamId);
  const { data: currentUserTeamMember } = useTeamMemberByUserId(session?.user?.id);
  const createIssueMutation = useCreateIssue();
  const createWorkflowIssueMutation = useCreateWorkflowIssue();

  const currentWorkspaceMember = useMemo(
    () =>
      teamMembers.find(
        (member) =>
          member.user?.id === session?.user?.id || member.userId === session?.user?.id,
      ) || null,
    [session?.user?.id, teamMembers],
  );

  const workflows = workflowResponses.map(
    (workflowResponse: WorkflowResponse): Workflow => {
      const workflow: Workflow = {
        id: workflowResponse.id,
        name: workflowResponse.name,
        description: workflowResponse.description || "",
        nodes: [],
        edges: [],
        createdAt: workflowResponse.createdAt,
        updatedAt: workflowResponse.updatedAt,
        createdBy: workflowResponse.creator?.user?.name || "Unknown user",
        isDraft: workflowResponse.status === "DRAFT",
        totalSteps: workflowResponse.totalSteps,
      };

      if (workflowResponse.json) {
        try {
          const parsedData =
            typeof workflowResponse.json === "string"
              ? JSON.parse(workflowResponse.json)
              : workflowResponse.json;

          workflow.nodes = parsedData.nodes || [];
          workflow.edges = parsedData.edges || [];
          workflow.description = parsedData.description || "";
        } catch (error) {
          console.error("Failed to parse workflow JSON:", error);
        }
      }

      return workflow;
    },
  );
  const availableWorkflowTemplates = workflows.filter(
    (workflow) => !workflow.isDraft && (workflow.totalSteps || 0) > 0,
  );
  const priorityOptions = useMemo(
    () => [
      { value: DEFAULT_PRIORITY_VALUE, label: t("priority.default") },
      { value: IssuePriority.LOW, label: t("priority.low") },
      { value: IssuePriority.NORMAL, label: t("priority.normal") },
      { value: IssuePriority.HIGH, label: t("priority.high") },
      { value: IssuePriority.URGENT, label: t("priority.urgent") },
    ],
    [t],
  );
  const stateCategoryOptions = useMemo(
    () => [
      { value: IssueStateCategory.BACKLOG, label: t("stateCategory.backlog") },
      { value: IssueStateCategory.TODO, label: t("stateCategory.todo") },
      { value: IssueStateCategory.IN_PROGRESS, label: t("stateCategory.inProgress") },
      { value: IssueStateCategory.DONE, label: t("stateCategory.done") },
      { value: IssueStateCategory.CANCELED, label: t("stateCategory.canceled") },
    ],
    [t],
  );

  const teamMemberOptions = useMemo<MemberOption[]>(
    () =>
      teamMembers
        .map((member) => ({
          id: member.id,
          name: getTeamMemberName(member),
          email: member.user.email,
        }))
        .sort((left, right) => left.name.localeCompare(right.name, locale)),
    [locale, teamMembers],
  );

  const personalAssigneeId =
    currentWorkspaceMember?.id || currentUserTeamMember?.id || "";

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedWorkflow = workflows.find(
    (workflow) => workflow.id === selectedWorkflowId,
  );
  const resolvedState =
    (selectedStateCategory
      ? resolveIssueStateForCategory(issueStates, selectedStateCategory)
      : issueStates.find((state) => state.isDefault) || issueStates[0]) || null;
  const isProjectContext = !!initialProjectId;
  const visibilityOptions = getVisibilityOptions(workspaceType, (key) => t(key));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedProjectId(initialProjectId || "");
    setSelectedVisibility(getDefaultVisibility(workspaceType));
  }, [initialProjectId, isOpen, workspaceType]);

  useEffect(() => {
    if (!isOpen || issueStates.length === 0 || selectedStateCategory) {
      return;
    }

    const defaultState = issueStates.find((state) => state.isDefault) || issueStates[0];
    if (defaultState) {
      setSelectedStateCategory(defaultState.category);
    }
  }, [isOpen, issueStates, selectedStateCategory]);

  useEffect(() => {
    if (workspaceType !== "PERSONAL") {
      return;
    }

    if (personalAssigneeId) {
      setDirectAssigneeId(personalAssigneeId);
      setSelectedAssigneeIds([personalAssigneeId]);
    }
  }, [personalAssigneeId, workspaceType]);

  useEffect(() => {
    if (workspaceType !== "TEAM" || !directAssigneeId) {
      return;
    }

    setSelectedAssigneeIds((previousIds) =>
      previousIds.includes(directAssigneeId)
        ? previousIds
        : [...previousIds, directAssigneeId],
    );
  }, [directAssigneeId, workspaceType]);

  useEffect(() => {
    if (workspaceType !== "TEAM" || teamMemberOptions.length === 0) {
      return;
    }

    const availableIds = new Set(teamMemberOptions.map((member) => member.id));

    if (directAssigneeId && !availableIds.has(directAssigneeId)) {
      setDirectAssigneeId("");
    }

    setSelectedAssigneeIds((previousIds) =>
      previousIds.filter((memberId) => availableIds.has(memberId)),
    );
  }, [directAssigneeId, teamMemberOptions, workspaceType]);

  const resetForm = () => {
    setIssueType("normal");
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setSelectedWorkflowId("");
    setSelectedProjectId(initialProjectId || "");
    setSelectedStateCategory("");
    setSelectedPriority("");
    setSelectedVisibility(getDefaultVisibility(workspaceType));
    setDirectAssigneeId("");
    setSelectedAssigneeIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAssigneeSelectionChange = (nextIds: string[]) => {
    setSelectedAssigneeIds(nextIds);

    if (directAssigneeId && !nextIds.includes(directAssigneeId)) {
      setDirectAssigneeId("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error(t("toasts.titleRequired"));
      return;
    }

    if (issueType === "workflow" && !selectedWorkflowId) {
      toast.error(t("toasts.workflowRequired"));
      return;
    }

    if (!session?.access_token) {
      toast.error(t("toasts.authRequired"));
      return;
    }

    if (workspaceType === "PERSONAL" && !personalAssigneeId) {
      toast.error(t("toasts.memberSyncPending"));
      return;
    }

    const normalizedAssigneeIds =
      workspaceType === "TEAM"
        ? Array.from(
            new Set([
              ...selectedAssigneeIds,
              ...(directAssigneeId ? [directAssigneeId] : []),
            ]),
          )
        : directAssigneeId
          ? [directAssigneeId]
          : [];

    const issueData: Partial<CreateIssueDto> = {
      title: title.trim(),
      description: description.trim() || undefined,
      workspaceId,
      stateId: resolvedState?.id,
      projectId: selectedProjectId || undefined,
      directAssigneeId: directAssigneeId || undefined,
      priority: selectedPriority || undefined,
      visibility: selectedVisibility,
      dueDate: dueDate
        ? (() => {
            const normalizedDate = new Date(dueDate);
            normalizedDate.setHours(0, 0, 0, 0);
            return normalizedDate.toISOString();
          })()
        : undefined,
      assigneeIds:
        workspaceType === "TEAM" && normalizedAssigneeIds.length > 0
          ? normalizedAssigneeIds
          : undefined,
    };

    const handleCreateError = (error: unknown) => {
      console.error("Failed to create issue:", error);
      toast.error(error instanceof Error ? error.message : t("toasts.createFailed"));
    };

    if (issueType === "normal") {
      createIssueMutation.mutate(
        {
          workspaceId,
          issue: issueData,
        },
        {
          onSuccess: () => {
            onCreated();
            handleClose();
          },
          onError: handleCreateError,
        },
      );
    } else {
      createWorkflowIssueMutation.mutate(
        {
          workspaceId,
          issue: issueData,
          workflowId: selectedWorkflowId,
        },
        {
          onSuccess: () => {
            onCreated();
            handleClose();
          },
          onError: handleCreateError,
        },
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-app-border bg-app-content-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-app-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary">
              {t("createModal.title")}
            </h2>
            <p className="mt-1 text-sm text-app-text-secondary">
              {workspaceType === "PERSONAL"
                ? t("createModal.workspace.personal")
                : t("createModal.workspace.team")}
              {isProjectContext
                ? ` · ${t("createModal.currentProject", {
                    name:
                      projectContextName ||
                      selectedProject?.name ||
                      tCommon("states.noneNamed"),
                  })}`
                : ""}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-app-text-secondary transition-colors hover:bg-app-button-hover"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {workspaceType === "TEAM" && (
            <div>
              <label className="mb-3 block text-sm font-medium text-app-text-primary">
                {t("createModal.type.label")}
              </label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={issueType === "normal" ? "default" : "outline"}
                  className={cn(
                    "h-10 rounded-xl",
                    issueType === "normal"
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : "border-app-border bg-app-bg text-app-text-primary",
                  )}
                  onClick={() => setIssueType("normal")}
                >
                  {t("createModal.type.normal")}
                </Button>
                <Button
                  type="button"
                  variant={issueType === "workflow" ? "default" : "outline"}
                  className={cn(
                    "h-10 rounded-xl",
                    issueType === "workflow"
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : "border-app-border bg-app-bg text-app-text-primary",
                  )}
                  onClick={() => setIssueType("workflow")}
                >
                  {t("createModal.type.workflow")}
                </Button>
              </div>
            </div>
          )}

          {workspaceType === "TEAM" && issueType === "workflow" && (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tCommon("entities.workflow")}
              </label>
              <Select
                value={selectedWorkflowId || undefined}
                onValueChange={setSelectedWorkflowId}
                disabled={isLoadingWorkflows}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder={t("createModal.workflow.placeholder")} />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {availableWorkflowTemplates.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWorkflow && (
                <div className="rounded-2xl border border-app-border bg-app-bg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
                    <RiFlowChart className="h-4 w-4 text-app-text-secondary" />
                    {selectedWorkflow.name}
                  </div>
                  <p className="mt-2 text-sm text-app-text-secondary">
                    {selectedWorkflow.description ||
                      t("createModal.workflow.missingDescription")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {t("createModal.project.label")}
              </label>
              <Select
                value={selectedProjectId || NONE_VALUE}
                onValueChange={(value) =>
                  setSelectedProjectId(value === NONE_VALUE ? "" : value)
                }
                disabled={isLoadingProjects}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder={t("createModal.project.placeholder")} />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  <SelectItem value={NONE_VALUE}>
                    {t("createModal.project.none")}
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tCommon("fields.visibility")}
              </label>
              <Select
                value={selectedVisibility}
                onValueChange={(value) => setSelectedVisibility(value as VisibilityType)}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder={t("createModal.fields.visibilityPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {visibilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-app-text-primary">
              {tCommon("fields.title")}
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("createModal.fields.titlePlaceholder")}
              className="h-11 rounded-xl border-app-border bg-app-bg text-app-text-primary"
              autoFocus
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-medium text-app-text-primary">
                {tCommon("fields.description")}
              </label>
              <IssueDescriptionTemplateAction
                tIssues={t}
                value={description}
                onApply={setDescription}
              />
            </div>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("createModal.fields.descriptionPlaceholder")}
              className="min-h-28 rounded-2xl border-app-border bg-app-bg text-app-text-primary"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tCommon("fields.state")}
              </label>
              <Select
                value={selectedStateCategory || undefined}
                onValueChange={(value) =>
                  setSelectedStateCategory(value as IssueStateCategory)
                }
                disabled={isLoadingIssueStates || issueStates.length === 0}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder={t("createModal.fields.statePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {stateCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tCommon("fields.priority")}
              </label>
              <Select
                value={selectedPriority || DEFAULT_PRIORITY_VALUE}
                onValueChange={(value) =>
                  setSelectedPriority(
                    value === DEFAULT_PRIORITY_VALUE ? "" : (value as IssuePriority),
                  )
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder={t("createModal.fields.priorityPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                {tCommon("fields.dueDate")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 justify-start rounded-xl border-app-border bg-app-bg text-left font-normal text-app-text-primary hover:bg-app-button-hover",
                      !dueDate && "text-app-text-muted",
                    )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    {dueDate
                      ? format(dueDate, "yyyy-MM-dd")
                      : t("createModal.fields.dueDatePlaceholder")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border-app-border bg-app-content-bg p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="border-t border-app-border p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-app-text-secondary"
                        onClick={() => setDueDate(undefined)}
                      >
                        {t("createModal.fields.clearDate")}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg px-4 py-4">
            <div className="mb-4">
              <div className="text-sm font-medium text-app-text-primary">
                {t("createModal.fields.directAssignee")}
              </div>
              <p className="mt-1 text-xs text-app-text-muted">
                {workspaceType === "PERSONAL"
                  ? t("createModal.assignee.personalHint")
                  : t("createModal.assignee.teamHint")}
              </p>
            </div>

            {workspaceType === "PERSONAL" ? (
              <div className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-3">
                <div className="text-sm font-medium text-app-text-primary">
                  {currentUserLabel}
                </div>
                <div className="mt-1 text-xs text-app-text-secondary">
                  {user?.email || tCommon("states.currentUser")}
                </div>
                <div className="mt-2 text-xs text-app-text-muted">
                  {personalAssigneeId
                    ? t("createModal.assignee.personalQueueHint")
                    : t("createModal.assignee.personalPendingHint")}
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-app-text-primary">
                    {t("createModal.fields.directAssignee")}
                  </label>
                  <Select
                    value={directAssigneeId || NONE_VALUE}
                    onValueChange={(value) =>
                      setDirectAssigneeId(value === NONE_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-content-bg text-app-text-primary">
                      <SelectValue placeholder={t("createModal.fields.directAssigneePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="border-app-border bg-app-content-bg">
                      <SelectGroup>
                        <SelectItem value={NONE_VALUE}>
                          {t("createModal.assignee.none")}
                        </SelectItem>
                        {teamMemberOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-app-text-primary">
                    {t("createModal.fields.additionalAssignees")}
                  </label>
                  <IssueMemberMultiSelect
                    members={teamMemberOptions}
                    selectedIds={selectedAssigneeIds}
                    onSelectionChange={handleAssigneeSelectionChange}
                    placeholder={t("createModal.assignee.additionalPlaceholder")}
                    searchPlaceholder={t("createModal.assignee.searchPlaceholder")}
                    emptyMessage={t("createModal.assignee.noMembers")}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-app-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-app-border bg-transparent text-app-text-primary"
              onClick={handleClose}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-sky-600 text-white hover:bg-sky-500"
              disabled={
                createIssueMutation.isPending ||
                createWorkflowIssueMutation.isPending
              }
            >
              {createIssueMutation.isPending || createWorkflowIssueMutation.isPending
                ? t("createModal.actions.creating")
                : t("createModal.actions.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
