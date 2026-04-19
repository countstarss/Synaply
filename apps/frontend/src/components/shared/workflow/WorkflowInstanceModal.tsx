"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { RiCloseLine, RiFlowChart } from "react-icons/ri";
import { toast } from "sonner";
import { WorkflowResponse } from "@/lib/fetchers/workflow";
import { useWorkflowInstance } from "@/hooks/useWorkflowInstance";

interface WorkflowInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowResponse | null;
  workspaceId?: string;
  onCreated?: () => void;
}

export default function WorkflowInstanceModal({
  isOpen,
  onClose,
  workflow,
  workspaceId,
  onCreated,
}: WorkflowInstanceModalProps) {
  const tWorkflows = useTranslations("workflows");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const workflowInstanceMutation = useWorkflowInstance();

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workflow) {
      return;
    }

    if (!title.trim()) {
      toast.error(tWorkflows("instance.validation.titleRequired"));
      return;
    }

    try {
      await workflowInstanceMutation.mutateAsync({
        workflow,
        title: title.trim(),
        description: description.trim() || undefined,
        workspaceId,
        dueDate: dueDate || undefined,
      });

      if (onCreated) {
        onCreated();
      }

      handleClose();
    } catch (error) {
      console.error("Failed to create workflow instance:", error);
    }
  };

  if (!isOpen || !workflow) return null;

  let parsedJson = null;
  try {
    if (workflow.json) {
      parsedJson =
        typeof workflow.json === "string"
          ? JSON.parse(workflow.json)
          : workflow.json;
    }
  } catch (error) {
    console.error("Failed to parse workflow JSON:", error);
  }

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            {tWorkflows("instance.title")}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
            aria-label={tCommon("actions.close")}
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <div className="p-4 bg-app-button-hover/50">
          <div className="flex items-center gap-2 mb-2">
            <RiFlowChart className="w-5 h-5 text-app-text-secondary" />
            <span className="font-medium text-app-text-primary">
              {workflow.name}
            </span>
          </div>
          {parsedJson?.description && (
            <p className="text-sm text-app-text-secondary">
              {parsedJson.description}
            </p>
          )}
          <div className="mt-2 text-xs text-app-text-muted">
            {tWorkflows("instance.steps", { count: workflow.totalSteps || 0 })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              {tWorkflows("instance.fields.title")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tWorkflows("instance.fields.titlePlaceholder")}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              {tWorkflows("instance.fields.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tWorkflows("instance.fields.descriptionPlaceholder")}
              rows={4}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              {tWorkflows("instance.fields.dueDate")}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
            >
              {tCommon("actions.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={workflowInstanceMutation.isPending}
            >
              {workflowInstanceMutation.isPending
                ? tWorkflows("instance.actions.creating")
                : tWorkflows("instance.actions.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
