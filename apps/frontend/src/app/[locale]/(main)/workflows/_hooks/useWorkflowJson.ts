import { useState } from "react";
import { useTranslations } from "next-intl";
import { Node, Edge } from "reactflow";
import { toast } from "sonner";
import { Workflow, WorkflowNode, WorkflowEdge } from "@/types/team";
import { generateId } from "../_utils/storage";

interface WorkflowJsonData {
  id: string;
  name: string;
  description: string;
  nodes: Node[] | WorkflowNode[];
  edges: Edge[] | WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags?: string[];
  isDraft?: boolean;
  version: string;
}

interface UseWorkflowJsonOptions {
  workflow: Workflow | null | undefined;
  nodes: Node[];
  edges: Edge[];
  workflowName: string;
  workflowDescription: string;
  isDraft: boolean;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
}

export function useWorkflowJson({
  workflow,
  nodes,
  edges,
  workflowName,
  workflowDescription,
  isDraft,
  setNodes,
  setEdges,
  setWorkflowName,
  setWorkflowDescription,
}: UseWorkflowJsonOptions) {
  const tWorkflows = useTranslations("workflows");
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // MARK: 构建工作流JSON
  const buildWorkflowJsonData = (): WorkflowJsonData => {
    return {
      id: workflow?.id || generateId(),
      name: workflowName.trim() || tWorkflows("shared.untitled"),
      description: workflowDescription.trim(),
      nodes,
      edges,
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workflow?.createdBy || tWorkflows("shared.currentUser"),
      tags: workflow?.tags || [],
      isDraft,
      version: "v1",
    };
  };

  // MARK: Flow导出为JSON
  const exportWorkflowJson = () => {
    try {
      const workflowData = buildWorkflowJsonData();

      // 生成JSON数据
      const jsonString = JSON.stringify(workflowData, null, 2);

      // 创建Blob并生成下载链接
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // 创建下载链接并触发点击
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workflowName || "workflow"}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      // 清理
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(tWorkflows("json.exportSuccessTitle"), {
        description: tWorkflows("json.exportSuccessDescription"),
      });
    } catch (error) {
      console.error("Failed to export workflow:", error);
      toast.error(tWorkflows("json.exportFailedTitle"), {
        description: tWorkflows("json.exportFailedDescription"),
      });
    }
  };

  // MARK: 导入工作流JSON
  const importWorkflowJson = () => {
    // 创建文件输入控件
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const jsonData = JSON.parse(event.target?.result as string);
            // 验证和处理JSON数据
            if (jsonData.nodes && jsonData.edges) {
              setNodes(jsonData.nodes);
              setEdges(jsonData.edges);
              if (jsonData.name) setWorkflowName(jsonData.name);
              if (jsonData.description)
                setWorkflowDescription(jsonData.description);

              toast.success(tWorkflows("json.importSuccessTitle"), {
                description: tWorkflows("json.importSuccessDescription", {
                  name: jsonData.name || tWorkflows("shared.untitled"),
                }),
              });
            } else {
              throw new Error(tWorkflows("json.invalidFormat"));
            }
          } catch (error) {
            console.error("Failed to import workflow:", error);
            toast.error(tWorkflows("json.importFailedTitle"), {
              description: tWorkflows("json.importFailedDescription"),
            });
          }
        };

        reader.readAsText(file);
      }
    };

    // 触发文件选择对话框
    fileInput.click();
  };

  // MARK: 查看工作流JSON
  const viewWorkflowJson = () => {
    // 构建当前工作流的JSON数据
    const workflowData = buildWorkflowJsonData();

    // 在控制台输出格式化的JSON
    console.log("Workflow JSON data:", workflowData);

    // 打开JSON查看模态框
    setIsJsonModalOpen(true);
  };

  // 记录保存的工作流数据
  const logSavedWorkflow = (workflowData: Workflow) => {
    console.log("Saved workflow data:", workflowData);
  };

  return {
    exportWorkflowJson,
    importWorkflowJson,
    viewWorkflowJson,
    logSavedWorkflow,
    isJsonModalOpen,
    setIsJsonModalOpen,
    buildWorkflowJsonData,
  };
}
