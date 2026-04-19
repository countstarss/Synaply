import React from "react";
import { useTranslations } from "next-intl";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSettings3Line,
  RiUserLine,
} from "react-icons/ri";
import { getColorClasses } from "@/app/[locale]/(main)/workflows/_components/SimpleColorPicker";

export interface NodeType {
  id: string; // 唯一 ID
  role: string;
  label: string;
  color: string;
  icon: string;
  /**
   * 节点负责人信息
   * assigneeId  保存 supabase user.id
   * assigneeName 用于前端展示
   */
  assigneeId?: string;
  assigneeName?: string;
  tags?: string[];
}

interface NodePanelProps {
  // onAddNode?: (nodeType: NodeType) => void; // Removed as it's not directly used here
  isCollapsed: boolean; // New prop for controlled collapse
  onToggleCollapse: () => void; // New prop for toggling collapse
  onManageNodes: () => void; // New prop to open settings modal
  customNodeTypes: NodeType[]; // New prop to pass custom nodes
}

export default function NodePanel({
  // onAddNode, // Removed from destructuring
  isCollapsed,
  onToggleCollapse,
  onManageNodes,
  customNodeTypes,
}: NodePanelProps) {
  const tWorkflows = useTranslations("workflows");
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(nodeType)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const defaultNodeTypes: NodeType[] = [
    {
      id: "product",
      role: "product",
      label: tWorkflows("nodePanel.defaults.product"),
      color:
        "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
      icon: "📋",
    },
    {
      id: "ui",
      role: "ui",
      label: tWorkflows("nodePanel.defaults.ui"),
      color:
        "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
      icon: "🎨",
    },
    {
      id: "frontend",
      role: "frontend",
      label: tWorkflows("nodePanel.defaults.frontend"),
      color:
        "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
      icon: "💻",
    },
    {
      id: "backend",
      role: "backend",
      label: tWorkflows("nodePanel.defaults.backend"),
      color:
        "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
      icon: "⚙️",
    },
    {
      id: "test",
      role: "test",
      label: tWorkflows("nodePanel.defaults.test"),
      color:
        "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
      icon: "🧪",
    },
    {
      id: "devops",
      role: "devops",
      label: tWorkflows("nodePanel.defaults.devops"),
      color:
        "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400",
      icon: "🔧",
    },
  ];

  const nodesToDisplay =
    customNodeTypes.length > 0 ? customNodeTypes : defaultNodeTypes;

  return (
    <div
      className={`absolute top-4 left-4 bg-app-content-bg rounded-lg shadow-lg dark:shadow-black/20 p-4 z-10 border border-app-border transition-all duration-300
        ${isCollapsed ? "w-12 overflow-hidden" : "w-64"}`} // Adjust width based on collapse state
    >
      <button
        onClick={onToggleCollapse}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-app-button-hover transition-colors text-app-text-secondary"
        title={
          isCollapsed
            ? tWorkflows("nodePanel.expand")
            : tWorkflows("nodePanel.collapse")
        }
      >
        {isCollapsed ? (
          <RiArrowRightSLine className="w-5 h-5" />
        ) : (
          <RiArrowLeftSLine className="w-5 h-5" />
        )}
      </button>

      {!isCollapsed && ( // Only show content when not collapsed
        <>
          <h3 className="text-sm font-semibold mb-3 text-app-text-primary">
            {tWorkflows("nodePanel.title")}
          </h3>
          <div className="space-y-2">
            {nodesToDisplay.map((nodeType) => {
              // 如果颜色是简单的颜色值（如 "blue"），则使用 getColorClasses 转换
              const colorClass = nodeType.color.includes(" ")
                ? nodeType.color // 已经是完整的类名
                : getColorClasses(nodeType.color); // 简单颜色值，需要转换

              return (
                <div
                  key={nodeType.id}
                  className={`${colorClass} border-2 px-3 py-2 rounded-lg cursor-move flex flex-col hover:shadow-md dark:hover:shadow-black/10 transition-shadow`}
                  onDragStart={(event) => onDragStart(event, nodeType)}
                  draggable
                >
                  <div className="flex items-center gap-2">
                    <span>{nodeType.icon}</span>
                    <span className="text-sm font-medium">
                      {nodeType.label}
                    </span>
                  </div>
                  {(nodeType.assigneeName || nodeType.assigneeId) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-app-text-secondary">
                      <RiUserLine className="w-3 h-3" />
                      <span className="truncate">
                        {nodeType.assigneeName || nodeType.assigneeId}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={onManageNodes}
            className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
          >
            <RiSettings3Line className="w-4 h-4" />
            {tWorkflows("nodePanel.manage")}
          </button>
        </>
      )}
    </div>
  );
}
