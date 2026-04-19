import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { RiCloseLine } from "react-icons/ri";
import { toast } from "sonner";

interface WorkflowSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (workflowInfo: { name: string; description: string }) => void;
  initialValues?: { name: string; description: string };
}

export default function WorkflowSetupModal({
  isOpen,
  onClose,
  onContinue,
  initialValues,
}: WorkflowSetupModalProps) {
  const tCommon = useTranslations("common");
  const tWorkflows = useTranslations("workflows");
  const [workflowName, setWorkflowName] = useState(initialValues?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    initialValues?.description || "",
  );

  // MARK: handleSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowName.trim()) {
      toast.error(tWorkflows("setup.nameRequired"));
      return;
    }
    onContinue({
      name: workflowName.trim(),
      description: workflowDescription.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/50 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            {tWorkflows("setup.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              {tWorkflows("setup.nameLabel")}
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder={tWorkflows("setup.namePlaceholder")}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              {tWorkflows("setup.descriptionLabel")}
            </label>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder={tWorkflows("setup.descriptionPlaceholder")}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
            >
              {tCommon("actions.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {tWorkflows("setup.continue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
