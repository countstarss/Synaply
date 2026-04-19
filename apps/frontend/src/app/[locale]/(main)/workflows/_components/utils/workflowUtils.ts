import { Issue } from "@/lib/fetchers/issue";
import { WorkflowIssue } from "@/types/team";
import { Node, Edge } from "reactflow";

/**
 * MARK: 创建 节点 和 边
 * NOTE: 将workflow和workflowIssue数据转换为ReactFlow可用的nodes和edges
 * @param workflow 工作流数据
 * @param workflowIssue 工作流议题数据
 * @returns 转换后的nodes和edges对象
 */
export const createFlowNodesAndEdges = (
  workflow: Record<string, unknown> | null,
  workflowIssue: WorkflowIssue | null
) => {
  if (!workflow || !workflowIssue) {
    return { nodes: [], edges: [] };
  }

  // 确保workflow包含必要的nodes和edges数组
  const workflowNodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const workflowEdges = Array.isArray(workflow.edges) ? workflow.edges : [];

  // 转换为ReactFlow节点
  const flowNodes: Node[] = workflowNodes.map((node: Node) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeStatus = workflowIssue.nodeStatuses[node.id] as any;
    const isCurrentNode = workflowIssue.currentNodeId === node.id;

    return {
      ...node,
      data: {
        ...node.data,
        status: nodeStatus?.status || "todo",
        // 优先使用 nodeStatus.assignee，其次使用原 node.data.assignee
        assigneeId:
          nodeStatus?.assigneeId ||
          (node.data as { assigneeId?: string })?.assigneeId,
        assigneeName:
          nodeStatus?.assigneeName ||
          (node.data as { assigneeName?: string })?.assigneeName,
        // 兼容 CustomNode 的旧 assignee 字段
        assignee:
          nodeStatus?.assigneeName ||
          (node.data as { assigneeName?: string })?.assigneeName,
        isCurrentNode, // 添加当前节点标识
      },
      className: isCurrentNode ? "ring-2 ring-blue-500" : "",
      // 移除 style 属性，让 CustomNode 组件自己处理颜色
    };
  });

  // 转换为ReactFlow边
  const flowEdges: Edge[] = workflowEdges.map((edge: Edge) => ({
    ...edge,
    animated: false,
  }));

  return { nodes: flowNodes, edges: flowEdges };
};

/**
 * MARK: 解析工作流快照
 * @param workflowSnapshot 工作流快照数据
 * @returns 解析后的工作流数据
 */
export const parseWorkflowSnapshot = (
  workflowSnapshot: string | Record<string, unknown> | null | undefined
) => {
  if (!workflowSnapshot) return null;
  return typeof workflowSnapshot === "string"
    ? JSON.parse(workflowSnapshot)
    : workflowSnapshot;
};

/**
 * MARK: 创建FlowIssue对象
 * 解析工作流快照，创建初始的WorkflowIssue对象
 * @param issue 议题对象
 * @returns 初始化的WorkflowIssue对象或null
 */
export const createInitialWorkflowIssue = (
  issue: Issue
): WorkflowIssue | null => {
  if (!issue.workflowSnapshot) return null;

  const snapshot: Record<string, unknown> =
    typeof issue.workflowSnapshot === "string"
      ? (JSON.parse(issue.workflowSnapshot) as Record<string, unknown>)
      : (issue.workflowSnapshot as Record<string, unknown>);

  const nodes: Node[] = (snapshot as { nodes?: Node[] }).nodes || [];

  // 构建默认的 nodeStatuses
  const nodeStatuses: Record<string, { status: string }> = {};
  const activeStepIndex =
    issue.workflowRun?.currentStepIndex ?? issue.currentStepIndex ?? 0;
  const activeStepStatus =
    issue.workflowRun?.currentStepStatus ?? issue.currentStepStatus ?? "TODO";
  nodes.forEach((n: Node, idx: number) => {
    const status =
      idx < activeStepIndex
        ? "DONE"
        : idx === activeStepIndex
        ? activeStepStatus || "TODO"
        : "TODO";

    const assigneeId = (n.data as { assigneeId?: string })?.assigneeId;
    const assigneeName = (n.data as { assigneeName?: string })?.assigneeName;

    nodeStatuses[n.id] = {
      status,
      ...(assigneeId ? { assigneeId } : {}),
      ...(assigneeName ? { assigneeName } : {}),
    } as { status: string; assigneeId?: string; assigneeName?: string };
  });

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description || "",
    workflowId: issue.workflowId || "",
    workflowName: (snapshot as { name?: string }).name || "Workflow",
    priority: issue.priority || "NORMAL",
    project: undefined,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    deadline: issue.dueDate || undefined,
    currentNodeId:
      issue.workflowRun?.currentStepId || issue.currentStepId || nodes[0]?.id,
    nodeStatuses,
    history: [],
  } as unknown as WorkflowIssue;
};
