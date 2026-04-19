import { create } from "zustand";

interface WorkspaceState {
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (workspaceId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspaceId: null,
  setCurrentWorkspaceId: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
}));
