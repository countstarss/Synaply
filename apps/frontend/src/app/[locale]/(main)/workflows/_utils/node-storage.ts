import { NodeType } from "@/components/workflow/NodePanel";

const STORAGE_KEY = "custom_workflow_nodes";

export const nodeStorage = {
  getAll(): NodeType[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveAll(nodes: NodeType[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  },

  // 可以添加其他方法，例如根据 ID 获取、删除单个节点等
};

export default nodeStorage;
