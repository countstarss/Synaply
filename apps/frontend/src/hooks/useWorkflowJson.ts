import { useState, useCallback } from "react";
import { Node, Edge, MarkerType } from "reactflow";
// import { CustomNodeData } from "@/app/[locale]/(main)/(team)/team/components/workflow/CustomNode";
import { Workflow, WorkflowNode, WorkflowEdge } from "@/types/team";
import { CustomNodeData } from "@/components/workflow/CustomNode";

interface WorkflowJsonHookResult {
  exportWorkflowJson: (nodes: Node<CustomNodeData>[], edges: Edge[]) => string;
  importWorkflowJson: (
    jsonString: string
  ) => { nodes: Node<CustomNodeData>[]; edges: Edge[] } | null;
  viewWorkflowJson: (nodes: Node<CustomNodeData>[], edges: Edge[]) => void;
  saveWorkflowWithJson: (
    workflow: Workflow,
    nodes: Node<CustomNodeData>[],
    edges: Edge[]
  ) => Workflow;
  jsonError: string | null;
}

// 将ReactFlow节点转换为WorkflowNode
const convertToWorkflowNode = (node: Node<CustomNodeData>): WorkflowNode => {
  return {
    id: node.id,
    type: "custom",
    position: { x: node.position.x, y: node.position.y },
    data: {
      label: node.data.label,
      role: node.data.role,
      color: node.data.color,
      assignee: node.data.assignee,
    },
  };
};

// 将ReactFlow边转换为WorkflowEdge
const convertToWorkflowEdge = (edge: Edge): WorkflowEdge => {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: edge.animated || false,
    markerEnd: edge.markerEnd ? { type: MarkerType.ArrowClosed } : undefined,
  };
};

/**
 * 工作流JSON数据处理Hook
 * 提供导出、导入、查看工作流JSON数据功能
 */
export function useWorkflowJson(): WorkflowJsonHookResult {
  const [jsonError, setJsonError] = useState<string | null>(null);

  /**
   * 导出工作流JSON
   */
  const exportWorkflowJson = useCallback(
    (nodes: Node<CustomNodeData>[], edges: Edge[]): string => {
      try {
        const workflowData = {
          version: "v1",
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type || "custom",
            position: node.position,
            data: {
              label: node.data.label,
              role: node.data.role,
              color: node.data.color,
              assignee: node.data.assignee,
            },
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: edge.animated,
            markerEnd: edge.markerEnd,
          })),
        };

        setJsonError(null);
        return JSON.stringify(workflowData, null, 2);
      } catch (error) {
        setJsonError(
          "导出JSON失败: " +
            (error instanceof Error ? error.message : String(error))
        );
        return "{}";
      }
    },
    []
  );

  /**
   * 导入工作流JSON
   */
  const importWorkflowJson = useCallback((jsonString: string) => {
    try {
      const parsedData = JSON.parse(jsonString);

      if (
        !parsedData.nodes ||
        !parsedData.edges ||
        !Array.isArray(parsedData.nodes) ||
        !Array.isArray(parsedData.edges)
      ) {
        throw new Error("JSON格式不正确，缺少nodes或edges数组");
      }

      // 转换为ReactFlow格式
      const nodes: Node<CustomNodeData>[] = parsedData.nodes.map(
        (node: {
          id: string;
          type?: string;
          position: { x: number; y: number };
          data: {
            label: string;
            role: string;
            color: string;
            assignee?: string;
          };
        }) => ({
          id: node.id,
          type: node.type || "custom",
          position: node.position,
          data: {
            label: node.data.label,
            role: node.data.role,
            color: node.data.color,
            assignee: node.data.assignee,
          },
        })
      );

      const edges: Edge[] = parsedData.edges.map(
        (edge: {
          id: string;
          source: string;
          target: string;
          animated?: boolean;
          markerEnd?: unknown;
        }) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: edge.animated,
          markerEnd: edge.markerEnd
            ? { type: MarkerType.ArrowClosed }
            : undefined,
        })
      );

      setJsonError(null);
      return { nodes, edges };
    } catch (error) {
      setJsonError(
        "导入JSON失败: " +
          (error instanceof Error ? error.message : String(error))
      );
      return null;
    }
  }, []);

  /**
   * 查看工作流JSON（在控制台输出）
   */
  const viewWorkflowJson = useCallback(
    (nodes: Node<CustomNodeData>[], edges: Edge[]) => {
      const jsonString = exportWorkflowJson(nodes, edges);
      console.log("工作流JSON数据:", JSON.parse(jsonString));
    },
    [exportWorkflowJson]
  );

  /**
   * 保存工作流时添加JSON数据
   */
  const saveWorkflowWithJson = useCallback(
    (
      workflow: Workflow,
      nodes: Node<CustomNodeData>[],
      edges: Edge[]
    ): Workflow => {
      try {
        const jsonString = exportWorkflowJson(nodes, edges);

        // 转换为Workflow兼容的格式
        const workflowNodes: WorkflowNode[] = nodes.map(convertToWorkflowNode);
        const workflowEdges: WorkflowEdge[] = edges.map(convertToWorkflowEdge);

        const updatedWorkflow: Workflow = {
          ...workflow,
          nodes: workflowNodes,
          edges: workflowEdges,
          version: "v1",
        };

        // 在控制台输出保存的数据
        console.log("保存的工作流数据:", updatedWorkflow);
        console.log("工作流JSON:", jsonString);

        setJsonError(null);
        return updatedWorkflow;
      } catch (error) {
        setJsonError(
          "保存工作流JSON失败: " +
            (error instanceof Error ? error.message : String(error))
        );
        return workflow;
      }
    },
    [exportWorkflowJson]
  );

  return {
    exportWorkflowJson,
    importWorkflowJson,
    viewWorkflowJson,
    saveWorkflowWithJson,
    jsonError,
  };
}
