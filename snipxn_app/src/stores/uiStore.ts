import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
