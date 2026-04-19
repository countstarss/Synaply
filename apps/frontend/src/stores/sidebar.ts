import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  activeTab: string;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setActiveTab: (tab: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  activeTab: "chat",
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
