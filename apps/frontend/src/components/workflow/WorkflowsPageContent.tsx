"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFlowChart,
  RiLoader4Line,
  RiSettings3Line,
} from "react-icons/ri";
import { useRouter } from "@/i18n/navigation";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import WorkflowSetupModal from "@/components/workflow/WorkflowSetupModal";
import WorkflowSettingsModal from "@/components/workflow/WorkflowSettingsModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Workflow } from "@/types/team";
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
  usePublishWorkflow,
  useWorkflowStats,
  useUpdateWorkflowJson,
} from "@/hooks/useWorkflowApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import AmbientGlow from "@/components/global/AmbientGlow";
import { toast } from "sonner";
import { WorkflowResponse } from "@/lib/fetchers/workflow";

export default function WorkflowsPageContent() {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tWorkflows = useTranslations("workflows");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowResponse | null>(null);
  const [pendingDeleteWorkflow, setPendingDeleteWorkflow] =
    useState<WorkflowResponse | null>(null);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const {
    data: workflows = [],
    isLoading,
    error,
  } = useWorkflows(currentWorkspace?.id);
  const { stats } = useWorkflowStats(currentWorkspace?.id);

  const createWorkflowMutation = useCreateWorkflow();
  const deleteWorkflowMutation = useDeleteWorkflow();
  const publishWorkflowMutation = usePublishWorkflow();
  const updateWorkflowJsonMutation = useUpdateWorkflowJson();

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setIsSetupModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("intent") !== "create-workflow") {
      return;
    }

    if (!currentWorkspace?.id || isSetupModalOpen) {
      return;
    }

    handleCreateNew();
    router.replace("/workflows");
  }, [currentWorkspace?.id, isSetupModalOpen, router, searchParams]);

  const handleSetupContinue = async (workflowInfo: {
    name: string;
    description: string;
  }) => {
    if (!currentWorkspace?.id) {
      toast.error(tWorkflows("toasts.workspaceIncomplete"));
      return;
    }

    let defaultVisibility: "PRIVATE" | "TEAM_EDITABLE" = "PRIVATE";

    if (currentWorkspace?.type === "TEAM") {
      defaultVisibility = "TEAM_EDITABLE";
    }

    try {
      const newWorkflow = await createWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        data: {
          name: workflowInfo.name,
          description: workflowInfo.description,
          visibility: defaultVisibility,
        },
      });

      const editingData: Workflow = {
        id: newWorkflow.id,
        name: newWorkflow.name,
        description: workflowInfo.description,
        nodes: [],
        edges: [],
        createdAt: newWorkflow.createdAt,
        updatedAt: newWorkflow.updatedAt,
        createdBy:
          newWorkflow.creator?.user?.name || tWorkflows("shared.currentUser"),
        isDraft: newWorkflow.status === "DRAFT",
        version: newWorkflow.version,
        assigneeMap: newWorkflow.assigneeMap || {},
        totalSteps: newWorkflow.totalSteps,
      };

      setEditingWorkflow(editingData);
      setIsSetupModalOpen(false);
      setViewMode("editor");
      toast.success(tWorkflows("toasts.createSuccess"));
    } catch (error) {
      console.error("Failed to create workflow:", error);
      toast.error(
        error instanceof Error ? error.message : tWorkflows("toasts.createFailed"),
      );
    }
  };

  const handleEditWorkflow = (workflowResponse: WorkflowResponse) => {
    const workflow: Workflow = {
      id: workflowResponse.id,
      name: workflowResponse.name,
      description: workflowResponse.description || "",
      nodes: [],
      edges: [],
      createdAt: workflowResponse.createdAt,
      updatedAt: workflowResponse.updatedAt,
      createdBy:
        workflowResponse.creator?.user?.name || tWorkflows("shared.unknownUser"),
      isDraft: workflowResponse.status === "DRAFT",
      version: workflowResponse.version,
      assigneeMap: workflowResponse.assigneeMap || {},
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
        workflow.description =
          workflowResponse.description || parsedData.description || "";
      } catch (error) {
        console.error("Failed to parse workflow JSON:", error);
      }
    }

    setEditingWorkflow(workflow);
    setViewMode("editor");
  };

  const handleSaveWorkflow = async (workflow: Workflow) => {
    if (!currentWorkspace?.id) {
      toast.error(tWorkflows("toasts.workspaceIncomplete"));
      return;
    }

    try {
      await updateWorkflowJsonMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: workflow.id,
        workflowData: {
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
          assigneeMap: workflow.assigneeMap,
        },
        status: workflow.isDraft ? "DRAFT" : undefined,
      });

      if (!workflow.isDraft) {
        await publishWorkflowMutation.mutateAsync({
          workspaceId: currentWorkspace.id,
          workflowId: workflow.id,
        });
      }

      setEditingWorkflow(null);
      setViewMode("list");
      toast.success(
        workflow.isDraft
          ? tWorkflows("toasts.saveDraftSuccess")
          : tWorkflows("toasts.publishSuccess"),
      );
    } catch (error) {
      console.error("Failed to save workflow:", error);
      throw error;
    }
  };

  const handleDeleteWorkflow = (workflow: WorkflowResponse) => {
    setPendingDeleteWorkflow(workflow);
  };

  const handleConfirmDeleteWorkflow = async () => {
    if (!currentWorkspace?.id) {
      toast.error(tWorkflows("toasts.workspaceIncomplete"));
      return;
    }

    if (!pendingDeleteWorkflow) {
      return;
    }

    try {
      await deleteWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: pendingDeleteWorkflow.id,
      });
      toast.success(tWorkflows("toasts.deleteSuccess"));
      setPendingDeleteWorkflow(null);
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      toast.error(
        error instanceof Error ? error.message : tWorkflows("toasts.deleteFailed"),
      );
    }
  };

  const handleOpenSettings = (workflow: WorkflowResponse) => {
    if (!workflow.json) {
      setSelectedWorkflow(workflow);
      setIsSettingsModalOpen(true);
      return;
    }

    try {
      const parsedData =
        typeof workflow.json === "string"
          ? JSON.parse(workflow.json)
          : workflow.json;

      setSelectedWorkflow({
        ...workflow,
        description:
          workflow.description ||
          (typeof parsedData?.description === "string"
            ? parsedData.description
            : undefined),
      });
    } catch {
      setSelectedWorkflow(workflow);
    }
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setSelectedWorkflow(null);
    setIsSettingsModalOpen(false);
  };

  const handleWorkflowUpdate = (updatedWorkflow: WorkflowResponse) => {
    setSelectedWorkflow(updatedWorkflow);
    setEditingWorkflow((current) => {
      if (!current || current.id !== updatedWorkflow.id) {
        return current;
      }

      return {
        ...current,
        name: updatedWorkflow.name,
        description: updatedWorkflow.description || current.description,
        isDraft: updatedWorkflow.status === "DRAFT",
        version: updatedWorkflow.version,
        totalSteps: updatedWorkflow.totalSteps,
        assigneeMap: updatedWorkflow.assigneeMap || current.assigneeMap,
      };
    });
  };

  const handleBackToList = () => {
    setEditingWorkflow(null);
    setViewMode("list");
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-app-text-secondary">
          <RiLoader4Line className="w-5 h-5 animate-spin" />
          {tWorkflows("page.states.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <RiFlowChart className="w-12 h-12 text-app-text-muted mx-auto mb-3" />
          <h3 className="text-base font-medium text-app-text-primary mb-1">
            {tWorkflows("page.states.loadFailedTitle")}
          </h3>
          <p className="text-app-text-secondary text-sm">
            {error.message || tWorkflows("page.states.loadFailedDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "editor") {
    return (
      <div className="h-full w-full">
        <WorkflowEditor
          workflow={editingWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-app-bg">
      <AmbientGlow />
      <div className="relative z-10 h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-app-text-primary">
                {tWorkflows("page.header.title")}
              </h1>
              <p className="mt-1 text-sm text-app-text-secondary">
                {tWorkflows("page.header.description")}
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              <RiAddLine className="w-4 h-4" />
              {tWorkflows("page.header.create")}
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-app-border bg-app-content-bg p-4">
              <p className="mb-1 text-xs text-app-text-secondary">
                {tWorkflows("page.stats.total")}
              </p>
              <p className="text-2xl font-semibold text-app-text-primary">
                {stats.total}
              </p>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-content-bg p-4">
              <p className="mb-1 text-xs text-app-text-secondary">
                {tWorkflows("page.stats.draft")}
              </p>
              <p className="text-2xl font-semibold text-app-text-primary">
                {stats.draft}
              </p>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-content-bg p-4">
              <p className="mb-1 text-xs text-app-text-secondary">
                {tWorkflows("page.stats.published")}
              </p>
              <p className="text-2xl font-semibold text-app-text-primary">
                {stats.published}
              </p>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-content-bg p-4">
              <p className="mb-1 text-xs text-app-text-secondary">
                {tWorkflows("page.stats.active")}
              </p>
              <p className="text-2xl font-semibold text-app-text-primary">
                {stats.active}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg cursor-pointer">
            <div className="flex items-center justify-between border-b border-app-border p-3">
              <h2 className="text-base font-semibold text-app-text-primary">
                {tWorkflows("page.list.title")}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDraftsOnly(!showDraftsOnly)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    showDraftsOnly
                      ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                      : "text-app-text-secondary hover:bg-app-button-hover/60 hover:text-app-text-primary"
                  }`}
                >
                  {showDraftsOnly
                    ? tWorkflows("page.list.showAll")
                    : tWorkflows("page.list.draftOnly")}
                </button>
              </div>
            </div>

            {workflows.length === 0 ? (
              <div className="p-8 text-center">
                <RiFlowChart className="w-12 h-12 text-app-text-muted mx-auto mb-3" />
                <h3 className="text-base font-medium text-app-text-primary mb-1">
                  {tWorkflows("page.list.emptyTitle")}
                </h3>
                <p className="text-app-text-secondary text-sm mb-4">
                  {tWorkflows("page.list.emptyDescription")}
                </p>
                <button
                  onClick={handleCreateNew}
                  className="mx-auto flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                  <RiAddLine className="w-4 h-4" />
                  {tWorkflows("page.list.emptyAction")}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-app-border">
                {workflows
                  .filter(
                    (workflow) =>
                      !showDraftsOnly || workflow.status === "DRAFT",
                  )
                  .map((workflow) => (
                    <div
                      key={workflow.id}
                      className="p-4 transition-colors hover:bg-app-button-hover/40"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-app-text-primary mb-1 truncate flex items-center gap-2">
                            {workflow.name}
                            {workflow.status === "DRAFT" && (
                              <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-900/20 dark:text-yellow-400">
                                {tWorkflows("page.badges.draft")}
                              </span>
                            )}
                            {workflow.status === "PUBLISHED" && (
                              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:border-green-500/30 dark:bg-green-900/20 dark:text-green-400">
                                {tWorkflows("page.badges.published")}
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-app-text-muted">
                            <span>
                              {tWorkflows("page.meta.nodes", {
                                count: workflow.totalSteps,
                              })}
                            </span>
                            <span>
                              {tWorkflows("page.meta.version", {
                                value: workflow.version,
                              })}
                            </span>
                            <span>
                              {tWorkflows("page.meta.activeRuns", {
                                count: workflow.usage?.activeRunCount || 0,
                              })}
                            </span>
                            <span>
                              {tWorkflows("page.meta.totalRuns", {
                                count: workflow.usage?.totalRunCount || 0,
                              })}
                            </span>
                            <span>
                              {tWorkflows("page.meta.creator", {
                                value:
                                  workflow.creator?.user?.name ||
                                  tWorkflows("shared.unknownUser"),
                              })}
                            </span>
                            <span>
                              {tWorkflows("page.meta.createdAt", {
                                value: new Date(workflow.createdAt).toLocaleDateString(
                                  locale,
                                ),
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            onClick={() => handleEditWorkflow(workflow)}
                            className="rounded p-1.5 text-app-text-secondary transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/20"
                            title={tWorkflows("page.actions.viewEdit")}
                          >
                            <RiEyeLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenSettings(workflow)}
                            className="rounded p-1.5 text-app-text-secondary transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/20"
                            title={tWorkflows("page.actions.settings")}
                          >
                            <RiSettings3Line className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditWorkflow(workflow)}
                            className="rounded p-1.5 text-app-text-secondary transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                            title={tCommon("actions.edit")}
                          >
                            <RiEditLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkflow(workflow)}
                            className="rounded p-1.5 text-app-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            title={tCommon("actions.delete")}
                            disabled={deleteWorkflowMutation.isPending}
                          >
                            {deleteWorkflowMutation.isPending ? (
                              <RiLoader4Line className="w-4 h-4 animate-spin" />
                            ) : (
                              <RiDeleteBinLine className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <WorkflowSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onContinue={handleSetupContinue}
      />

      {selectedWorkflow && (
        <WorkflowSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettings}
          workflow={selectedWorkflow}
          onUpdate={handleWorkflowUpdate}
        />
      )}

      <Dialog
        open={Boolean(pendingDeleteWorkflow)}
        onOpenChange={(open) => {
          if (!open && !deleteWorkflowMutation.isPending) {
            setPendingDeleteWorkflow(null);
          }
        }}
      >
        <DialogContent className="border-app-border bg-app-content-bg text-app-text-primary">
          <DialogHeader>
            <DialogTitle>{tWorkflows("page.deleteDialog.title")}</DialogTitle>
            <DialogDescription className="text-app-text-secondary">
              {pendingDeleteWorkflow
                ? tWorkflows("page.deleteDialog.description", {
                    name: pendingDeleteWorkflow.name,
                  })
                : tWorkflows("page.deleteDialog.fallbackDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="rounded-lg border border-app-border px-4 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover"
              disabled={deleteWorkflowMutation.isPending}
              onClick={() => setPendingDeleteWorkflow(null)}
            >
              {tCommon("actions.cancel")}
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deleteWorkflowMutation.isPending}
              onClick={() => void handleConfirmDeleteWorkflow()}
            >
              {deleteWorkflowMutation.isPending
                ? tWorkflows("page.deleteDialog.deleting")
                : tWorkflows("page.deleteDialog.confirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
