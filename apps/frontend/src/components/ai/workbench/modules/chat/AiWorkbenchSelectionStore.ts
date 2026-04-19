"use client";

import { create } from "zustand";
import type { AiMessageRecord } from "@/lib/ai/types";

interface AiWorkbenchSelectionState {
  isSelectionMode: boolean;
  selectedMessages: AiMessageRecord[];
  autoSelectEnabled: boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelectionMode: () => void;
  addToSelection: (message: AiMessageRecord) => void;
  toggleMessageSelection: (message: AiMessageRecord) => void;
  clearSelection: () => void;
  isSelected: (messageId: string) => boolean;
  setAutoSelectEnabled: (enabled: boolean) => void;
  resetSelectionState: () => void;
}

export const useAiWorkbenchSelectionStore =
  create<AiWorkbenchSelectionState>((set, get) => ({
    isSelectionMode: false,
    selectedMessages: [],
    autoSelectEnabled: false,
    enterSelectionMode: () =>
      set((state) => ({
        isSelectionMode: true,
        selectedMessages: state.selectedMessages,
        autoSelectEnabled: state.autoSelectEnabled,
      })),
    exitSelectionMode: () =>
      set({
        isSelectionMode: false,
        selectedMessages: [],
        autoSelectEnabled: false,
      }),
    toggleSelectionMode: () =>
      set((state) => {
        const nextMode = !state.isSelectionMode;

        return {
          isSelectionMode: nextMode,
          selectedMessages: nextMode ? state.selectedMessages : [],
          autoSelectEnabled: nextMode ? state.autoSelectEnabled : false,
        };
      }),
    addToSelection: (message) =>
      set((state) => {
        if (!state.isSelectionMode) {
          return state;
        }

        if (state.selectedMessages.some((item) => item.id === message.id)) {
          return state;
        }

        return {
          selectedMessages: [...state.selectedMessages, message],
        };
      }),
    toggleMessageSelection: (message) =>
      set((state) => {
        if (!state.isSelectionMode) {
          return state;
        }

        const alreadySelected = state.selectedMessages.some(
          (item) => item.id === message.id,
        );

        return {
          selectedMessages: alreadySelected
            ? state.selectedMessages.filter((item) => item.id !== message.id)
            : [...state.selectedMessages, message],
        };
      }),
    clearSelection: () => set({ selectedMessages: [] }),
    isSelected: (messageId) =>
      get().selectedMessages.some((message) => message.id === messageId),
    setAutoSelectEnabled: (enabled) => set({ autoSelectEnabled: enabled }),
    resetSelectionState: () =>
      set({
        isSelectionMode: false,
        selectedMessages: [],
        autoSelectEnabled: false,
      }),
  }));
