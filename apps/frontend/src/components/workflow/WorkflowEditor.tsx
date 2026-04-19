"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode, { CustomNodeData } from "./CustomNode";
import NodePanel, { NodeType } from "./NodePanel";
import { Workflow, WorkflowNode, WorkflowEdge } from "@/types/team";
import { generateId } from "@/app/[locale]/(main)/workflows/_utils/storage";
import NodeSettingsModal from "./NodeSettingsModal";
import { nodeStorage } from "@/app/[locale]/(main)/workflows/_utils/node-storage";
import WorkflowEditorToolbar from "./WorkflowEditorToolbar";
import { getColorClasses } from "@/app/[locale]/(main)/workflows/_components/SimpleColorPicker";
import NodeDetailsModal from "./NodeDetailsModal";
import { toast } from "sonner";
import { useWorkflowJson } from "@/app/[locale]/(main)/workflows/_hooks/useWorkflowJson";

const nodeTypes = {
  custom: CustomNode,
};

let id = 6;
const getId = () => `${id++}`;

interface WorkflowEditorProps {
  workflow?: Workflow | null;
  onSave?: (workflow: Workflow) => Promise<void> | void;
  onCancel?: () => void;
}

function Flow({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const tWorkflows = useTranslations("workflows");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [workflowName, setWorkflowName] = useState(workflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isNodePanelCollapsed, setIsNodePanelCollapsed] = useState(false);
  const [isNodeSettingsModalOpen, setIsNodeSettingsModalOpen] = useState(false);
  const [customNodeTypes, setCustomNodeTypes] = useState<NodeType[]>([]);
  const [isDraft, setIsDraft] = useState(workflow?.isDraft || false);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(
    null
  );
  const [isNodeDetailsModalOpen, setIsNodeDetailsModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { project } = useReactFlow();

  // MARK: useWorkflowJson
  const {
    exportWorkflowJson,
    importWorkflowJson,
    viewWorkflowJson,
    logSavedWorkflow,
    isJsonModalOpen,
    setIsJsonModalOpen,
    buildWorkflowJsonData,
  } = useWorkflowJson({
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
  });

  // Load custom node types
  useEffect(() => {
    setCustomNodeTypes(nodeStorage.getAll());
  }, []);

  const toggleNodePanelCollapse = () => {
    setIsNodePanelCollapsed(!isNodePanelCollapsed);
  };

  const handleCustomNodesSave = (nodes: NodeType[]) => {
    setCustomNodeTypes(nodes);
  };

  // Update nodes and edges when workflow prop changes
  useEffect(() => {
    if (workflow) {
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setWorkflowName(workflow.name || "");
      setWorkflowDescription(workflow.description || "");
      setIsDraft(workflow.isDraft || false);
    } else {
      setNodes([]);
      setEdges([]);
      setWorkflowName("");
      setWorkflowDescription("");
      setIsDraft(true);
    }
  }, [workflow, setNodes, setEdges]);

  // MARK: onConnect
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = {
        ...params,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // MARK: onDragOver
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // MARK: onDrop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/reactflow");

      if (typeof data === "undefined" || !data || !reactFlowBounds) {
        return;
      }

      const nodeType: NodeType = JSON.parse(data);
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type: "custom",
        position,
        data: {
          label: nodeType.label,
          role: nodeType.role,
          color: nodeType.color.includes(" ")
            ? nodeType.color
            : getColorClasses(nodeType.color),
          icon: nodeType.icon,
          assigneeId: nodeType.assigneeId,
          assigneeName: nodeType.assigneeName,
          assignee: nodeType.assigneeName,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  // MARK: 双击
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<CustomNodeData>);
      setIsNodeDetailsModalOpen(true);
    },
    [setSelectedNode]
  );

  // MARK: 更新节点详情
  const handleNodeDetailsUpdate = (
    nodeId: string,
    updatedData: Partial<CustomNodeData>
  ) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }
        // 创建一个包含更新数据的新节点对象，以确保 React Flow 检测到变化。
        return {
          ...node,
          data: {
            ...node.data,
            ...updatedData,
          },
        };
      })
    );
  };

  // MARK: 验证工作流
  const validateWorkflow = (): string[] => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push(tWorkflows("editor.validation.atLeastOneNode"));
    }

    const nodesWithoutAssignee = nodes.filter((node) => !node.data.assignee);
    if (nodesWithoutAssignee.length > 0) {
      errors.push(
        tWorkflows("editor.validation.missingAssignees", {
          count: nodesWithoutAssignee.length,
        }),
      );
    }

    if (nodes.length > 1) {
      const startNodes = nodes.filter(
        (node) => !edges.some((edge) => edge.target === node.id)
      );
      if (startNodes.length === 0) {
        errors.push(tWorkflows("editor.validation.missingStart"));
      }

      const endNodes = nodes.filter(
        (node) => !edges.some((edge) => edge.source === node.id)
      );
      if (endNodes.length === 0) {
        errors.push(tWorkflows("editor.validation.missingEnd"));
      }
    }

    if (nodes.length > 1) {
      const connectedNodeIds = new Set<string>();
      edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const isolatedNodes = nodes.filter(
        (node) => !connectedNodeIds.has(node.id)
      );
      if (isolatedNodes.length > 0) {
        errors.push(
          tWorkflows("editor.validation.isolatedNodes", {
            count: isolatedNodes.length,
          }),
        );
      }
    }

    setValidationErrors(errors);
    return errors;
  };

  // MARK: 保存工作流
  const handleSave = async (saveAsDraft = false) => {
    setIsSaving(true);

    try {
      if (!saveAsDraft) {
        const errors = validateWorkflow();
        if (errors.length > 0) {
          toast.error(
            tWorkflows("editor.validation.summary", {
              errors: errors.join("; "),
            }),
          );
          return;
        }
      } else {
        setValidationErrors([]);
      }

      const finalName = workflowName.trim() || tWorkflows("shared.untitled");

      const workflowData: Workflow = {
        id: workflow?.id || generateId(),
        name: finalName,
        description: workflowDescription.trim(),
        nodes: nodes as WorkflowNode[],
        edges: edges as WorkflowEdge[],
        createdAt: workflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: workflow?.createdBy || tWorkflows("shared.currentUser"),
        tags: workflow?.tags || [],
        isDraft: saveAsDraft,
        version: workflow?.version,
        assigneeMap: workflow?.assigneeMap,
        totalSteps: nodes.length,
      };

      logSavedWorkflow(workflowData);

      await onSave?.(workflowData);
      setIsDraft(saveAsDraft);
    } catch (error) {
      console.error("Failed to save workflow:", error);
      toast.error(
        error instanceof Error ? error.message : tWorkflows("toasts.saveFailed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkflow = () => handleSave(false);
  const handleSaveAsDraft = () => handleSave(true);

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full h-full relative">
      {/* Workflow Editor Toolbar */}
      <WorkflowEditorToolbar
        workflowName={workflowName || tWorkflows("shared.untitled")}
        isDraft={isDraft}
        isSaving={isSaving}
        onSave={handleSaveWorkflow}
        onSaveAsDraft={handleSaveAsDraft}
        onGoBack={onCancel || (() => {})}
        onExportJSON={exportWorkflowJson}
        onImportJSON={importWorkflowJson}
        onViewJSON={viewWorkflowJson}
        disabled={false}
      />

      {/* Node Panel */}
      <NodePanel
        isCollapsed={isNodePanelCollapsed}
        onToggleCollapse={toggleNodePanelCollapse}
        onManageNodes={() => setIsNodeSettingsModalOpen(true)}
        customNodeTypes={customNodeTypes}
      />

      {/* ReactFlow Editor */}
      <div className="w-full h-full bg-app-bg" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          proOptions={proOptions}
        >
          <Controls className="!bg-app-content-bg !border-app-border" />
          <MiniMap className="!bg-app-content-bg !border-app-border" />
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
            className="!bg-transparent"
          />
        </ReactFlow>
      </div>

      {/* Modals */}
      <NodeSettingsModal
        isOpen={isNodeSettingsModalOpen}
        onClose={() => setIsNodeSettingsModalOpen(false)}
        onSave={handleCustomNodesSave}
      />

      {/* 新增节点详情模态框 */}
      <NodeDetailsModal
        isOpen={isNodeDetailsModalOpen}
        onClose={() => setIsNodeDetailsModalOpen(false)}
        node={selectedNode}
        onSave={handleNodeDetailsUpdate}
      />

      {/* 验证错误提示 */}
      {validationErrors.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-red-50 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 p-3 rounded-lg shadow-lg max-w-md">
          <h4 className="font-medium mb-1">
            {tWorkflows("editor.validation.title")}
          </h4>
          <ul className="text-sm list-disc pl-5">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <button
            className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2"
            onClick={() => setValidationErrors([])}
          >
            {tWorkflows("editor.validation.close")}
          </button>
        </div>
      )}

      {/* JSON Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <h2 className="text-lg font-semibold text-app-text-primary">
                {tWorkflows("editor.jsonModal.title")}
              </h2>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1.5 hover:bg-app-button-hover rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-app-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-60px)]">
              <pre className="bg-app-bg rounded p-4 text-app-text-secondary overflow-x-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(buildWorkflowJsonData(), null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-app-border flex justify-end">
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
              >
                {tWorkflows("editor.jsonModal.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowEditor({
  workflow,
  onSave,
  onCancel,
}: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <Flow workflow={workflow} onSave={onSave} onCancel={onCancel} />
    </ReactFlowProvider>
  );
}
