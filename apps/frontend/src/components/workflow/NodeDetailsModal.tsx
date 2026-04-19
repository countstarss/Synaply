import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  RiCloseLine,
  RiUserLine,
  RiTimeLine,
  RiFileTextLine,
} from "react-icons/ri";
import { Node } from "reactflow";
import { CustomNodeData } from "./CustomNode";
import MentionInput from "@/app/[locale]/(main)/workflows/_components/MentionInput";

interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<CustomNodeData> | null;
  onSave: (nodeId: string, updatedData: Partial<CustomNodeData>) => void;
}

export default function NodeDetailsModal({
  isOpen,
  onClose,
  node,
  onSave,
}: NodeDetailsModalProps) {
  const tCommon = useTranslations("common");
  const tWorkflows = useTranslations("workflows");
  const [nodeData, setNodeData] = useState<Partial<CustomNodeData>>({});
  const [formData, setFormData] = useState({
    description: "",
    estimatedHours: "",
    assignee: "",
  });

  useEffect(() => {
    if (node && node.data) {
      setNodeData(node.data);
      setFormData({
        description: node.data.description || "",
        estimatedHours: node.data.estimatedHours
          ? node.data.estimatedHours.toString()
          : "",
        assignee: node.data.assignee || "",
      });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAssigneeChange = (value: string) => {
    setFormData({
      ...formData,
      assignee: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<CustomNodeData> = {
      description: formData.description,
      assignee: formData.assignee,
      estimatedHours: formData.estimatedHours
        ? parseFloat(formData.estimatedHours)
        : undefined,
    };

    onSave(node.id, updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            {tWorkflows("nodeDetails.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 显示节点基本信息 */}
          <div className="flex items-center gap-3 pb-4 border-b border-app-border">
            <div className="w-10 h-10 flex items-center justify-center text-2xl">
              {nodeData.icon || "📄"}
            </div>
            <div>
              <h3 className="font-medium text-app-text-primary">
                {nodeData.label || tWorkflows("nodeDetails.nodeFallback")}
              </h3>
              <p className="text-sm text-app-text-secondary">
                {nodeData.role || tWorkflows("shared.noRole")}
              </p>
            </div>
          </div>

          {/* 负责人 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-app-text-primary mb-2">
              <RiUserLine className="w-4 h-4" />
              {tWorkflows("nodeDetails.assigneeLabel")}
            </label>
            <MentionInput
              value={formData.assignee}
              onChange={handleAssigneeChange}
              placeholder={tWorkflows("nodeDetails.assigneePlaceholder")}
              className="w-full"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-app-text-primary mb-2">
              <RiFileTextLine className="w-4 h-4" />
              {tWorkflows("nodeDetails.descriptionLabel")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={tWorkflows("nodeDetails.descriptionPlaceholder")}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              rows={3}
            />
          </div>

          {/* 预计工时 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-app-text-primary mb-2">
              <RiTimeLine className="w-4 h-4" />
              {tWorkflows("nodeDetails.estimatedHoursLabel")}
            </label>
            <input
              type="number"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleChange}
              placeholder={tWorkflows("nodeDetails.estimatedHoursPlaceholder")}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.5"
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
              {tWorkflows("settingsModal.actions.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
