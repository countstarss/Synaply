import {
  QueryClient,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  AdvanceWorkflowRunDto,
  advanceWorkflowRun,
  acceptWorkflowHandoff,
  AcceptWorkflowHandoffDto,
  BlockWorkflowRunDto,
  blockWorkflowRun,
  cancelIssue,
  CreateIssueDto,
  CreateWorkflowIssueDto,
  DEFAULT_ISSUES_PAGE_SIZE,
  createIssue,
  createWorkflowIssue,
  CreateIssueStepRecordDto,
  CreateIssueActivityDto,
  deleteIssue,
  GetIssuesOptions,
  getIssue,
  getIssueActivities,
  getIssueStepRecords,
  getIssues,
  getWorkflowRun,
  Issue,
  IssueQueryParams,
  isWorkflowIssue,
  normalizeIssueQueryParams,
  RespondWorkflowReviewDto,
  RequestWorkflowHandoffDto,
  requestWorkflowHandoff,
  RequestWorkflowReviewDto,
  requestWorkflowReview,
  respondWorkflowReview,
  RevertWorkflowRunDto,
  revertWorkflowRun,
  SubmitWorkflowRecordDto,
  submitWorkflowRecord,
  unblockWorkflowRun,
  UnblockWorkflowRunDto,
  updateIssue,
  updateWorkflowRunStatus,
  UpdateWorkflowRunStatusDto,
  createIssueActivity,
  createIssueStepRecord,
} from "@/lib/fetchers/issue";
import { broadcastIssueDeleted } from "@/lib/realtime/broadcast";
import { IssueScope, IssueType } from "@/types/prisma";

type IssueListQueryKey = readonly [
  "issues",
  string,
  IssueQueryParams,
  {
    fetchAll: boolean;
    defaultPageSize: number;
  },
];

const OPTIMISTIC_ISSUE_ID_PREFIX = "optimistic-issue-";

function isIssueListQueryKey(
  queryKey: QueryKey,
  workspaceId: string,
): queryKey is IssueListQueryKey {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "issues" &&
    queryKey[1] === workspaceId &&
    typeof queryKey[2] === "object" &&
    queryKey[2] !== null &&
    typeof queryKey[3] === "object" &&
    queryKey[3] !== null
  );
}

function createOptimisticIssue(
  workspaceId: string,
  creatorId: string,
  issue: Partial<CreateIssueDto>,
  issueType: IssueType,
): Issue {
  const now = new Date().toISOString();
  const optimisticIssueId = `${OPTIMISTIC_ISSUE_ID_PREFIX}${Date.now()}`;

  return {
    id: optimisticIssueId,
    title: issue.title || "",
    description: issue.description ?? null,
    workspaceId,
    projectId: issue.projectId ?? null,
    directAssigneeId: issue.directAssigneeId ?? null,
    creatorId,
    stateId: issue.stateId ?? null,
    createdAt: now,
    updatedAt: now,
    dueDate: issue.dueDate ?? null,
    priority: issue.priority ?? null,
    visibility: issue.visibility,
    issueType,
    workflowId: issueType === IssueType.WORKFLOW ? "pending-workflow" : null,
    assignees:
      issue.assigneeIds?.map((memberId, index) => ({
        id: `${optimisticIssueId}-assignee-${index}`,
        issueId: optimisticIssueId,
        memberId,
      })) ?? [],
    labels:
      issue.labelIds?.map((labelId, index) => ({
        id: `${optimisticIssueId}-label-${index}`,
        issueId: optimisticIssueId,
        labelId,
      })) ?? [],
  };
}

function matchesIssueQuery(issue: Issue, params: IssueQueryParams) {
  if (
    params.scope === IssueScope.PERSONAL &&
    issue.visibility !== "PRIVATE"
  ) {
    return false;
  }

  if (params.scope === IssueScope.TEAM && issue.visibility === "PRIVATE") {
    return false;
  }

  if (params.projectId && issue.projectId !== params.projectId) {
    return false;
  }

  if (params.stateId && issue.stateId !== params.stateId) {
    return false;
  }

  if (params.stateCategory && issue.state?.category !== params.stateCategory) {
    return false;
  }

  if (params.assigneeId) {
    const isDirectAssignee = issue.directAssigneeId === params.assigneeId;
    const isInAssignees = issue.assignees?.some(
      (assignee) => assignee.memberId === params.assigneeId,
    );

    if (!isDirectAssignee && !isInAssignees) {
      return false;
    }
  }

  if (
    params.labelId &&
    !issue.labels?.some((label) => label.labelId === params.labelId)
  ) {
    return false;
  }

  if (params.issueType && issue.issueType !== params.issueType) {
    return false;
  }

  if (params.priority && issue.priority !== params.priority) {
    return false;
  }

  return true;
}

function updateIssueListCaches(
  queryClient: QueryClient,
  workspaceId: string,
  issue: Issue,
  optimisticIssueId?: string,
) {
  const queries = queryClient.getQueriesData<Issue[]>({
    queryKey: ["issues", workspaceId],
  });

  for (const [queryKey, data] of queries) {
    if (!data || !isIssueListQueryKey(queryKey, workspaceId)) {
      continue;
    }

    const params = normalizeIssueQueryParams(queryKey[2]);
    const queryOptions = queryKey[3];
    const existingIndex = data.findIndex(
      (currentIssue) =>
        currentIssue.id === issue.id ||
        (optimisticIssueId ? currentIssue.id === optimisticIssueId : false),
    );

    if (existingIndex >= 0) {
      queryClient.setQueryData<Issue[]>(
        queryKey,
        data.map((currentIssue) =>
          currentIssue.id === issue.id ||
          (optimisticIssueId ? currentIssue.id === optimisticIssueId : false)
            ? issue
            : currentIssue,
        ),
      );
      continue;
    }

    if (params.cursor || !matchesIssueQuery(issue, params)) {
      continue;
    }

    const nextIssues =
      params.sortOrder === "asc" ? [...data, issue] : [issue, ...data];
    const maxItems =
      params.limit ??
      (queryOptions.fetchAll ? undefined : queryOptions.defaultPageSize);

    queryClient.setQueryData<Issue[]>(
      queryKey,
      maxItems ? nextIssues.slice(0, maxItems) : nextIssues,
    );
  }
}

/**
 * MARK: 获取工作空间Issue
 */
export const useIssues = (
  workspaceId: string,
  params: IssueQueryParams = {},
  options: { enabled?: boolean } & GetIssuesOptions = {},
) => {
  const { session } = useAuth();
  const normalizedParams = normalizeIssueQueryParams(params);
  const fetchAll = options.fetchAll ?? false;
  const defaultPageSize =
    options.defaultPageSize ?? DEFAULT_ISSUES_PAGE_SIZE;

  return useQuery({
    queryKey: [
      "issues",
      workspaceId,
      normalizedParams,
      { fetchAll, defaultPageSize },
    ],
    queryFn: async () => {
      if (!session?.access_token) return [];
      return getIssues(workspaceId, session.access_token, normalizedParams, {
        fetchAll,
        defaultPageSize,
      });
    },
    enabled:
      (options.enabled ?? true) && !!session?.access_token && !!workspaceId,
  });
};

export const useIssue = (
  workspaceId: string,
  issueId: string,
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issue", workspaceId, issueId],
    queryFn: async () => {
      if (!session?.access_token) {
        return null;
      }

      return getIssue(workspaceId, issueId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) &&
      !!session?.access_token &&
      !!workspaceId &&
      !!issueId,
  });
};

export const useWorkflowRun = (
  workspaceId: string,
  issueId: string,
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["workflow-run", workspaceId, issueId],
    queryFn: async () => {
      if (!session?.access_token) {
        return null;
      }

      return getWorkflowRun(workspaceId, issueId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) &&
      !!session?.access_token &&
      !!workspaceId &&
      !!issueId,
  });
};

/**
 * MARK: 创建普通Issue
 */
export const useCreateIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issue,
    }: {
      workspaceId: string;
      issue: Partial<CreateIssueDto>;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      const issueData: CreateIssueDto = {
        title: issue.title || "",
        description: issue.description,
        workspaceId,
        stateId: issue.stateId,
        projectId: issue.projectId,
        directAssigneeId: issue.directAssigneeId,
        priority: issue.priority,
        visibility: issue.visibility,
        dueDate: issue.dueDate,
        assigneeIds: issue.assigneeIds,
        labelIds: issue.labelIds,
      };

      return createIssue(issueData, session.access_token);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["issues", variables.workspaceId],
      });

      const previousIssues = queryClient.getQueriesData<Issue[]>({
        queryKey: ["issues", variables.workspaceId],
      });
      const optimisticIssue = createOptimisticIssue(
        variables.workspaceId,
        session?.user?.id ?? "",
        variables.issue,
        IssueType.NORMAL,
      );

      updateIssueListCaches(
        queryClient,
        variables.workspaceId,
        optimisticIssue,
      );

      return {
        previousIssues,
        optimisticIssueId: optimisticIssue.id,
      };
    },
    onError: (_error, variables, context) => {
      context?.previousIssues.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (createdIssue, variables, context) => {
      updateIssueListCaches(
        queryClient,
        variables.workspaceId,
        createdIssue,
        context?.optimisticIssueId,
      );
      queryClient.setQueryData(
        ["issue", variables.workspaceId, createdIssue.id],
        createdIssue,
      );
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      if (createdIssue.projectId) {
        void queryClient.invalidateQueries({
          queryKey: ["project-summary", variables.workspaceId, createdIssue.projectId],
          exact: true,
        });
      }
    },
  });
};

/**
 * MARK: 基于工作流创建
 */
export const useCreateWorkflowIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issue,
      workflowId,
    }: {
      workspaceId: string;
      issue: Partial<CreateIssueDto>;
      workflowId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      const issueData: CreateWorkflowIssueDto = {
        title: issue.title || "",
        description: issue.description,
        workspaceId,
        dueDate: issue.dueDate,
        projectId: issue.projectId,
        directAssigneeId: issue.directAssigneeId,
        stateId: issue.stateId,
        priority: issue.priority,
        visibility: issue.visibility,
        assigneeIds: issue.assigneeIds,
        labelIds: issue.labelIds,
        workflowId,
      };

      const createdIssue = await createWorkflowIssue(
        issueData,
        session.access_token
      );

      return isWorkflowIssue(createdIssue)
        ? createdIssue
        : { ...createdIssue, issueType: IssueType.WORKFLOW };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["issues", variables.workspaceId],
      });

      const previousIssues = queryClient.getQueriesData<Issue[]>({
        queryKey: ["issues", variables.workspaceId],
      });
      const optimisticIssue = createOptimisticIssue(
        variables.workspaceId,
        session?.user?.id ?? "",
        variables.issue,
        IssueType.WORKFLOW,
      );

      updateIssueListCaches(
        queryClient,
        variables.workspaceId,
        optimisticIssue,
      );

      return {
        previousIssues,
        optimisticIssueId: optimisticIssue.id,
      };
    },
    onError: (_error, variables, context) => {
      context?.previousIssues.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (createdIssue, variables, context) => {
      updateIssueListCaches(
        queryClient,
        variables.workspaceId,
        createdIssue,
        context?.optimisticIssueId,
      );
      queryClient.setQueryData(
        ["issue", variables.workspaceId, createdIssue.id],
        createdIssue,
      );
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      if (createdIssue.projectId) {
        void queryClient.invalidateQueries({
          queryKey: ["project-summary", variables.workspaceId, createdIssue.projectId],
          exact: true,
        });
      }
    },
  });
};

function invalidateWorkflowRunQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  issueId: string
) {
  queryClient.invalidateQueries({
    queryKey: ["issue", workspaceId, issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["workflow-run", workspaceId, issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["issues", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["my-work", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["inbox", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["inbox-summary", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["issue-step-records", issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["issue-activities", issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["project-summary", workspaceId],
  });
}

export const useUpdateWorkflowRunStatus = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: UpdateWorkflowRunStatusDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateWorkflowRunStatus(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useAdvanceWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: AdvanceWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return advanceWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useRevertWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RevertWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return revertWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useBlockWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: BlockWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return blockWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useUnblockWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: UnblockWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return unblockWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useRequestWorkflowReview = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RequestWorkflowReviewDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return requestWorkflowReview(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useRequestWorkflowHandoff = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RequestWorkflowHandoffDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return requestWorkflowHandoff(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useRespondWorkflowReview = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RespondWorkflowReviewDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return respondWorkflowReview(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useAcceptWorkflowHandoff = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: AcceptWorkflowHandoffDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return acceptWorkflowHandoff(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

export const useSubmitWorkflowRecord = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: SubmitWorkflowRecordDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return submitWorkflowRecord(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );
    },
  });
};

/**
 * MARK: 更新 Issue （PATCH）
 */
export const useUpdateIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: Partial<Issue>;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateIssue(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: (_updatedIssue, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

    },
  });
};

/**
 * MARK: 取消 Issue（软取消）
 */
export const useCancelIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
    }: {
      workspaceId: string;
      issueId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return cancelIssue(workspaceId, issueId, session.access_token);
    },
    onSuccess: (_updatedIssue, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["issue-activities", variables.issueId],
      });

    },
  });
};

/**
 * MARK: 删除 Issue
 */
export const useDeleteIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
    }: {
      workspaceId: string;
      issueId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }
      await deleteIssue(workspaceId, issueId, session.access_token);
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

      if (!session?.access_token) {
        return;
      }

      await broadcastIssueDeleted(
        {
          issueId: variables.issueId,
          workspaceId: variables.workspaceId,
        },
        session.access_token,
      );
    },
  });
};

/**
 * MARK: 步骤记录列表
 */
export const useIssueStepRecords = (workspaceId: string, issueId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issue-step-records", issueId],
    queryFn: () =>
      getIssueStepRecords(workspaceId, issueId, session!.access_token),
    enabled: !!session?.access_token && !!issueId,
  });
};

export const useCreateIssueStepRecord = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: CreateIssueStepRecordDto;
    }) => {
      if (!session?.access_token) throw new Error("未授权");
      return createIssueStepRecord(
        workspaceId,
        issueId,
        data,
        session.access_token,
      );
    },
    onSuccess: (_createdStepRecord, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue-step-records", variables.issueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });
    },
  });
};

/**
 * MARK: Issue Activities
 */
export const useIssueActivities = (workspaceId: string, issueId: string) => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["issue-activities", issueId],
    queryFn: () =>
      getIssueActivities(workspaceId, issueId, session!.access_token),
    enabled: !!session?.access_token && !!issueId,
  });
};

export const useCreateIssueActivity = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: CreateIssueActivityDto;
    }) => {
      if (!session?.access_token) throw new Error("未授权");
      return createIssueActivity(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: (_createdActivity, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue-activities", variables.issueId],
      });
    },
  });
};
