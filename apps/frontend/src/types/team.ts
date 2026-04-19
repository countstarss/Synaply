import { MarkerType } from "reactflow";

export interface WorkflowNode {
  id: string;
  type: "custom";
  position: { x: number; y: number };
  data: {
    label: string;
    role: string;
    color: string;
    assignee?: string;
    status?: "TODO" | "IN_PROGRESS" | "AMOST_DONE" | "BLOCKED" | "DONE";
    estimatedHours?: number;
    actualHours?: number;
    description?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  markerEnd?: {
    type: MarkerType;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags?: string[];
  isDraft?: boolean;
  version?: string;
  assigneeMap?: Record<string, string>;
  totalSteps?: number;
}

export interface WorkflowIssue {
  id: string;
  title: string;
  description: string;
  workflowId: string;
  workflowName: string;
  status: "TODO" | "IN_PROGRESS" | "AMOST_DONE" | "BLOCKED" | "DONE";
  project?: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  currentNodeId?: string;
  nodeStatuses: Record<
    string,
    {
      status: "TODO" | "IN_PROGRESS" | "AMOST_DONE" | "BLOCKED" | "DONE";
      assignee?: string;
      startedAt?: string;
      completedAt?: string;
      comments?: string[];
    }
  >;
  history: {
    timestamp: string;
    action: string;
    nodeId?: string;
    fromUser: string;
    toUser?: string;
    comment?: string;
  }[];
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "AMOST_DONE" | "BLOCKED" | "DONE";
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  assignee?: string;
  project?: string;
  createdAt: string;
  updatedAt: string;
  type: "normal" | "workflow";
  workflowData?: WorkflowIssue;
}
