import { Issue, Workflow, WorkflowNode, WorkflowIssue } from "@/types/team";

const STORAGE_KEYS = {
  WORKFLOWS: "team_workflows",
  ISSUES: "team_issues",
  WORKFLOW_ISSUES: "team_workflow_issues",
} as const;

// MARK: - Workflow
export const workflowStorage = {
  getAll(): Workflow[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
    return stored ? JSON.parse(stored) : [];
  },

  getById(id: string): Workflow | null {
    const workflows = this.getAll();
    return workflows.find((w) => w.id === id) || null;
  },

  save(workflow: Workflow): void {
    if (typeof window === "undefined") return;
    const workflows = this.getAll();

    // 添加版本号
    if (!workflow.version) {
      workflow.version = "v1";
    }

    // 生成assigneeMap (记录哪些节点有哪些负责人)
    const assigneeMap: Record<string, string> = {};
    workflow.nodes.forEach((node: WorkflowNode) => {
      if (node.data.assignee) {
        assigneeMap[node.id] = node.data.assignee;
      }
    });
    workflow.assigneeMap = assigneeMap;

    // 计算节点总数
    workflow.totalSteps = workflow.nodes.length;

    const index = workflows.findIndex((w) => w.id === workflow.id);
    if (index !== -1) {
      workflows[index] = workflow;
    } else {
      workflows.push(workflow);
    }
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
  },

  delete(id: string): void {
    if (typeof window === "undefined") return;
    const workflows = this.getAll();
    const filteredWorkflows = workflows.filter((w) => w.id !== id);
    localStorage.setItem(
      STORAGE_KEYS.WORKFLOWS,
      JSON.stringify(filteredWorkflows)
    );
  },
};

// MARK: - Issue Storage
export const issueStorage = {
  getAll(): Issue[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.ISSUES);
    return stored ? JSON.parse(stored) : [];
  },

  save(issue: Issue): void {
    if (typeof window === "undefined") return;
    const issues = this.getAll();
    const existingIndex = issues.findIndex((i) => i.id === issue.id);

    if (existingIndex >= 0) {
      issues[existingIndex] = issue;
    } else {
      issues.push(issue);
    }

    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
  },

  getById(id: string): Issue | null {
    return this.getAll().find((i) => i.id === id) || null;
  },

  delete(id: string): void {
    if (typeof window === "undefined") return;
    const issues = this.getAll().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
  },
};

// MARK: - Flow Issue
export const workflowIssueStorage = {
  getAll(): WorkflowIssue[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOW_ISSUES);
    return stored ? JSON.parse(stored) : [];
  },

  save(workflowIssue: WorkflowIssue): void {
    if (typeof window === "undefined") return;
    const workflowIssues = this.getAll();
    const existingIndex = workflowIssues.findIndex(
      (wi) => wi.id === workflowIssue.id
    );

    if (existingIndex >= 0) {
      workflowIssues[existingIndex] = workflowIssue;
    } else {
      workflowIssues.push(workflowIssue);
    }

    localStorage.setItem(
      STORAGE_KEYS.WORKFLOW_ISSUES,
      JSON.stringify(workflowIssues)
    );
  },

  getById(id: string): WorkflowIssue | null {
    return this.getAll().find((wi) => wi.id === id) || null;
  },

  getByWorkflowId(workflowId: string): WorkflowIssue[] {
    return this.getAll().filter((wi) => wi.workflowId === workflowId);
  },

  delete(id: string): void {
    if (typeof window === "undefined") return;
    const workflowIssues = this.getAll().filter((wi) => wi.id !== id);
    localStorage.setItem(
      STORAGE_KEYS.WORKFLOW_ISSUES,
      JSON.stringify(workflowIssues)
    );
  },
};

// Utility function to generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
