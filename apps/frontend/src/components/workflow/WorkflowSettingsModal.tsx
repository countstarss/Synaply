import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RiCloseLine, RiSaveLine, RiLoader4Line } from "react-icons/ri";
import { useUpdateWorkflow, usePublishWorkflow } from "@/hooks/useWorkflowApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { WorkflowResponse } from "@/lib/fetchers/workflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowDocKindPanel } from "@/components/workflow/WorkflowDocKindPanel";

interface WorkflowSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    name: string;
    status: string;
    visibility: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
    totalSteps: number;
    description?: string;
    version?: string;
  };
  onUpdate: (updatedWorkflow: WorkflowResponse) => void;
}

export default function WorkflowSettingsModal({
  isOpen,
  onClose,
  workflow,
  onUpdate,
}: WorkflowSettingsModalProps) {
  const tCommon = useTranslations("common");
  const tWorkflows = useTranslations("workflows");
  const [name, setName] = useState(workflow.name);
  const [visibility, setVisibility] = useState<
    "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC"
  >(workflow.visibility);
  const [description, setDescription] = useState(workflow.description || "");

  useEffect(() => {
    setName(workflow.name);
    setVisibility(workflow.visibility);
    setDescription(workflow.description || "");
  }, [workflow.description, workflow.name, workflow.visibility]);

  const { currentWorkspace } = useWorkspace();
  const updateWorkflowMutation = useUpdateWorkflow();
  const publishWorkflowMutation = usePublishWorkflow();

  const handleSave = async () => {
    if (!currentWorkspace?.id) {
      toast.error(tWorkflows("toasts.workspaceIncomplete"));
      return;
    }

    try {
      const updatedWorkflow = await updateWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: workflow.id,
        data: {
          name: name.trim() || workflow.name,
          visibility,
          description: description.trim(),
          status: workflow.status,
        },
      });

      onUpdate(updatedWorkflow);
      onClose();
      toast.success(tWorkflows("settingsModal.toasts.saved"));
    } catch (error) {
      console.error("Failed to save workflow settings:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : tWorkflows("settingsModal.toasts.saveFailed"),
      );
    }
  };

  const handlePublish = async () => {
    if (!currentWorkspace?.id) {
      toast.error(tWorkflows("toasts.workspaceIncomplete"));
      return;
    }

    if (workflow.totalSteps === 0) {
      toast.error(tWorkflows("settingsModal.toasts.publishNeedSteps"));
      return;
    }

    try {
      const trimmedName = name.trim() || workflow.name;
      const trimmedDescription = description.trim();
      const hasMetadataChanges =
        trimmedName !== workflow.name ||
        visibility !== workflow.visibility ||
        trimmedDescription !== (workflow.description || "");

      if (hasMetadataChanges) {
        await updateWorkflowMutation.mutateAsync({
          workspaceId: currentWorkspace.id,
          workflowId: workflow.id,
          data: {
            name: trimmedName,
            visibility,
            description: trimmedDescription,
            status: workflow.status,
          },
        });
      }

      const publishedWorkflow = await publishWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: workflow.id,
      });

      onUpdate(publishedWorkflow);
      onClose();
      toast.success(tWorkflows("settingsModal.toasts.published"));
    } catch (error) {
      console.error("Failed to publish workflow:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : tWorkflows("settingsModal.toasts.publishFailed"),
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h2 className="text-lg font-semibold text-app-text-primary">
            {tWorkflows("settingsModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-app-button-hover rounded transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 基本信息 */}
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-1">
              {tWorkflows("settingsModal.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={tWorkflows("settingsModal.namePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-1">
              {tWorkflows("settingsModal.descriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={tWorkflows("settingsModal.descriptionPlaceholder")}
            />
          </div>

          {/* 可见性设置 */}
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-1">
              {tWorkflows("settingsModal.visibilityLabel")}
            </label>
            <Select
              value={visibility}
              onValueChange={(value) =>
                setVisibility(
                  value as
                    | "PRIVATE"
                    | "TEAM_READONLY"
                    | "TEAM_EDITABLE"
                    | "PUBLIC",
                )
              }
            >
              <SelectTrigger className="w-full border-app-border bg-app-bg text-app-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-app-border bg-app-content-bg">
                <SelectItem value="PRIVATE">
                  {tWorkflows("settingsModal.visibility.private")}
                </SelectItem>
                <SelectItem value="PUBLIC">
                  {tWorkflows("settingsModal.visibility.public")}
                </SelectItem>
                <SelectItem value="TEAM_READONLY">
                  {tWorkflows("settingsModal.visibility.teamReadonly")}
                </SelectItem>
                <SelectItem value="TEAM_EDITABLE">
                  {tWorkflows("settingsModal.visibility.teamEditable")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 状态信息 */}
          <div className="bg-app-bg p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-app-text-secondary">
                {tWorkflows("settingsModal.statusLabel")}:
              </span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  workflow.status === "PUBLISHED"
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {workflow.status === "PUBLISHED"
                  ? tWorkflows("settingsModal.statuses.published")
                  : tWorkflows("settingsModal.statuses.draft")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-app-text-secondary">
                {tWorkflows("settingsModal.stepsLabel")}:
              </span>
              <span className="text-app-text-primary">
                {workflow.totalSteps}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-app-text-secondary">
                {tWorkflows("settingsModal.versionLabel")}:
              </span>
              <span className="text-app-text-primary">
                {workflow.version || "v1"}
              </span>
            </div>
          </div>

          {currentWorkspace?.id ? (
            <WorkflowDocKindPanel
              workspaceId={currentWorkspace.id}
              workspaceType={currentWorkspace.type}
              workflow={workflow}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-app-border">
          <div className="flex gap-2">
            {workflow.status === "DRAFT" && workflow.totalSteps > 0 && (
              <button
                onClick={handlePublish}
                disabled={
                  publishWorkflowMutation.isPending ||
                  updateWorkflowMutation.isPending
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg transition-colors"
              >
                {publishWorkflowMutation.isPending ||
                updateWorkflowMutation.isPending ? (
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                ) : (
                  <RiSaveLine className="w-4 h-4" />
                )}
                {tWorkflows("settingsModal.actions.publish")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-app-text-secondary hover:text-app-text-primary text-sm rounded-lg transition-colors"
            >
              {tCommon("actions.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={updateWorkflowMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
            >
              {updateWorkflowMutation.isPending ? (
                <RiLoader4Line className="w-4 h-4 animate-spin" />
              ) : (
                <RiSaveLine className="w-4 h-4" />
              )}
              {tWorkflows("settingsModal.actions.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
