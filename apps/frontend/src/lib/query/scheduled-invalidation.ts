"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";

type InvalidationRefetchType = "active" | "inactive" | "all" | "none";

interface ScheduledInvalidationRequest {
  queryKey: QueryKey;
  exact?: boolean;
  refetchType?: InvalidationRefetchType;
}

interface ScheduleInvalidationOptions {
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 80;
const pendingInvalidations = new Map<
  string,
  ReturnType<typeof setTimeout>
>();

function buildInvalidationKey({
  queryKey,
  exact = false,
  refetchType = "active",
}: ScheduledInvalidationRequest) {
  return JSON.stringify({
    queryKey,
    exact,
    refetchType,
  });
}

export function scheduleQueryInvalidation(
  queryClient: QueryClient,
  request: ScheduledInvalidationRequest,
  options: ScheduleInvalidationOptions = {},
) {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const invalidationKey = buildInvalidationKey(request);

  if (pendingInvalidations.has(invalidationKey)) {
    return;
  }

  const timeoutId = setTimeout(() => {
    pendingInvalidations.delete(invalidationKey);

    void queryClient.invalidateQueries({
      queryKey: request.queryKey,
      exact: request.exact,
      refetchType: request.refetchType,
    });
  }, debounceMs);

  pendingInvalidations.set(invalidationKey, timeoutId);
}

export function scheduleQueryInvalidations(
  queryClient: QueryClient,
  requests: ScheduledInvalidationRequest[],
  options: ScheduleInvalidationOptions = {},
) {
  for (const request of requests) {
    scheduleQueryInvalidation(queryClient, request, options);
  }
}
