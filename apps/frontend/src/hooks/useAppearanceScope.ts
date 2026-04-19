"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAppearanceStore } from "@/stores/appearance";

/**
 * Keeps the appearance store scoped to the active user + workspace so each
 * combination gets its own persisted preferences in localStorage.
 */
export function useAppearanceScope() {
  const { user } = useAuth();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setScope = useAppearanceStore((s) => s.setScope);

  React.useEffect(() => {
    setScope({ userId: user?.id ?? null, workspaceId });
  }, [user?.id, workspaceId, setScope]);
}
