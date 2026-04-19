"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getIssueStates } from "@/lib/fetchers/issue-state";

export const useIssueStates = (
  workspaceId: string,
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issue-states", workspaceId],
    queryFn: async () => {
      if (!session?.access_token) {
        return [];
      }

      return getIssueStates(workspaceId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) && !!session?.access_token && !!workspaceId,
    staleTime: 2 * 60 * 1000,
  });
};
