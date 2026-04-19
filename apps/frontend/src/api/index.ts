/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CreateTeamDto {
  /**
   * The name of the team
   * @example "Team 1"
   */
  name: string;
}

export interface UserDto {
  /** 用户ID */
  id: string;
  /** 用户邮箱 */
  email: string;
  /** 用户名称 */
  name: string | null;
  /** 用户头像URL */
  avatarUrl: string | null;
  /**
   * 创建时间
   * @format date-time
   */
  createdAt: string;
  /**
   * 更新时间
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamMemberDto {
  /** 团队成员ID */
  id: string;
  /** 团队ID */
  teamId: string;
  /** 用户ID */
  userId: string;
  /** 成员角色 */
  role: "OWNER" | "ADMIN" | "MEMBER";
  /** 用户信息 */
  user: UserDto;
  /**
   * 创建时间
   * @format date-time
   */
  createdAt: string;
  /**
   * 更新时间
   * @format date-time
   */
  updatedAt: string;
}

export interface WorkspaceUserDto {
  /** 用户ID */
  id: string;
  /** 用户邮箱 */
  email: string;
  /** 用户名称 */
  name: string | null;
  /** 用户头像URL */
  avatarUrl: string | null;
}

export interface WorkspaceTeamDto {
  /** 团队ID */
  id: string;
  /** 团队名称 */
  name: string;
  /**
   * 创建时间
   * @format date-time
   */
  createdAt: string;
  /**
   * 更新时间
   * @format date-time
   */
  updatedAt: string;
}

export interface WorkspaceDto {
  /** 工作空间ID */
  id: string;
  /** 工作空间名称 */
  name: string;
  /** 工作空间类型 */
  type: "PERSONAL" | "TEAM";
  /** 个人工作空间所属用户ID */
  userId: string | null;
  /** 团队工作空间所属团队ID */
  teamId: string | null;
  /** 所属用户信息（个人工作空间） */
  user: WorkspaceUserDto | null;
  /** 所属团队信息（团队工作空间） */
  team: WorkspaceTeamDto | null;
  /**
   * 创建时间
   * @format date-time
   */
  createdAt: string;
  /**
   * 更新时间
   * @format date-time
   */
  updatedAt: string;
}

export interface TeamDto {
  /** 团队ID */
  id: string;
  /** 团队名称 */
  name: string;
  /** 团队成员列表 */
  members: TeamMemberDto[];
  /** 团队工作空间 */
  workspace: WorkspaceDto | null;
  /**
   * 创建时间
   * @format date-time
   */
  createdAt: string;
  /**
   * 更新时间
   * @format date-time
   */
  updatedAt: string;
}

export interface InviteMemberDto {
  /**
   * The email of the member to invite
   * @example "luke@wizlab.org"
   */
  email: string;
}

export interface InviteResultDto {
  /** 邀请结果信息 */
  message: string;
}

export interface RemoveMemberResultDto {
  /** 移除成员结果信息 */
  message: string;
}

export interface CreateWorkflowDto {
  /**
   * The name of the workflow
   * @example "Workflow 1"
   */
  name: string;
  /** The description of the workflow */
  description?: string;
  /**
   * The visibility of the workflow
   * @default "PRIVATE"
   */
  visibility?: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
}

export interface UpdateWorkflowDto {
  /** The name of the workflow */
  name?: string;
  /** The description of the workflow */
  description?: string;
  /** The status of the workflow */
  status?: string;
  /** The JSON data of the workflow */
  json?: Record<string, unknown> | string;
  /** The visibility of the workflow */
  visibility?: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
  /** The assignee map of the workflow */
  assigneeMap?: Record<string, string>;
  /** Total number of steps in the workflow */
  totalSteps?: number;
  /** Current step index */
  currentStepIndex?: number;
  /** Workflow version */
  version?: string;
  /** Whether this is a system template */
  isSystemTemplate?: boolean;
}

export interface CreateIssueDto {
  /** The title of the issue */
  title: string;
  /** The description of the issue */
  description?: string;
  /** The workspace ID of the issue */
  workspaceId: string;
  /** The project ID of the issue */
  projectId?: string;
  /** The workflow ID of the issue */
  workflowId?: string;
  /** The current step ID of the issue */
  currentStepId?: string;
  /** The direct assignee ID of the issue */
  directAssigneeId?: string;
  /** The status of the issue */
  status?: string;
  /** The priority of the issue */
  priority?: string;
  /**
   * The due date of the issue
   * @format date-time
   */
  dueDate?: string;
  /**
   * The start date of the issue
   * @format date-time
   */
  startDate?: string;
  /** The parent task ID of the issue */
  parentTaskId?: string;
  /**
   * The visibility of the issue
   * @default "PRIVATE"
   */
  visibility?: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
}

export interface UpdateIssueDto {
  /** The title of the issue */
  status?: string;
  /** The priority of the issue */
  priority?: string;
  /**
   * The due date of the issue
   * @format date-time
   */
  dueDate?: string;
  /**
   * The start date of the issue
   * @format date-time
   */
  startDate?: string;
  /** The current step ID of the issue */
  currentStepId?: string;
}

export interface CreateCommentDto {
  /**
   * The content of the comment
   * @example "This is a comment"
   */
  content: string;
}

export interface CreateIssueDependencyDto {
  /** The ID of the issue that this issue depends on */
  dependsOnIssueId: string;
}

export interface CreateProjectDto {
  /** The name of the project */
  name: string;
  /** The description of the project */
  description?: string;
  /**
   * The visibility of the project
   * @default "PRIVATE"
   */
  visibility?: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
}

export interface UpdateProjectDto {
  /** The name of the project */
  name?: string;
  /** The description of the project */
  description?: string;
  /**
   * The visibility of the project
   * @default "PRIVATE"
   */
  visibility?: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Synaply API
 * @version 1.0
 * @contact
 *
 * Synaply项目的API文档
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags app
   * @name AppControllerGetHello
   * @summary 获取欢迎信息
   * @request GET:/
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<string, any>({
      path: `/`,
      method: "GET",
      format: "json",
      ...params,
    });

  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerGetMe
     * @summary 获取当前用户信息
     * @request GET:/auth/me
     * @secure
     */
    authControllerGetMe: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/me`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetMe
     * @summary 获取当前用户详细信息
     * @request GET:/users/me
     * @secure
     */
    userControllerGetMe: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetUserById
     * @summary 根据用户ID获取公开用户信息
     * @request GET:/users/{userId}
     * @secure
     */
    userControllerGetUserById: (userId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/${userId}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  teams = {
    /**
     * @description 创建新团队，创建者自动成为团队拥有者，并创建对应的团队工作空间
     *
     * @tags teams
     * @name TeamControllerCreate
     * @summary 创建团队
     * @request POST:/teams
     * @secure
     */
    teamControllerCreate: (data: CreateTeamDto, params: RequestParams = {}) =>
      this.request<TeamDto, void>({
        path: `/teams`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 获取当前用户作为成员的所有团队列表
     *
     * @tags teams
     * @name TeamControllerGetUserTeams
     * @summary 获取用户所属团队列表
     * @request GET:/teams
     * @secure
     */
    teamControllerGetUserTeams: (params: RequestParams = {}) =>
      this.request<TeamDto[], any>({
        path: `/teams`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 只有团队的OWNER或ADMIN可以邀请新成员
     *
     * @tags teams
     * @name TeamControllerInvite
     * @summary 邀请成员加入团队
     * @request POST:/teams/{teamId}/invite
     * @secure
     */
    teamControllerInvite: (
      teamId: string,
      data: InviteMemberDto,
      params: RequestParams = {},
    ) =>
      this.request<InviteResultDto, void>({
        path: `/teams/${teamId}/invite`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 获取指定团队的详细信息，包括成员列表和工作空间信息
     *
     * @tags teams
     * @name TeamControllerGetTeam
     * @summary 获取团队详情
     * @request GET:/teams/{teamId}
     * @secure
     */
    teamControllerGetTeam: (teamId: string, params: RequestParams = {}) =>
      this.request<TeamDto, void>({
        path: `/teams/${teamId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 获取指定团队的所有成员信息
     *
     * @tags teams
     * @name TeamControllerGetTeamMembers
     * @summary 获取团队成员列表
     * @request GET:/teams/{teamId}/members
     * @secure
     */
    teamControllerGetTeamMembers: (
      teamId: string,
      params: RequestParams = {},
    ) =>
      this.request<TeamMemberDto[], any>({
        path: `/teams/${teamId}/members`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 只有团队的OWNER或ADMIN可以更新成员角色
     *
     * @tags teams
     * @name TeamControllerUpdateMemberRole
     * @summary 更新团队成员角色
     * @request PATCH:/teams/{teamId}/members/{memberId}/role
     * @secure
     */
    teamControllerUpdateMemberRole: (
      teamId: string,
      memberId: string,
      data: {
        /** 新角色 */
        role?: "OWNER" | "ADMIN" | "MEMBER";
      },
      params: RequestParams = {},
    ) =>
      this.request<TeamMemberDto, void>({
        path: `/teams/${teamId}/members/${memberId}/role`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 只有团队的OWNER或ADMIN可以移除成员，不能移除最后一个拥有者
     *
     * @tags teams
     * @name TeamControllerRemoveMember
     * @summary 移除团队成员
     * @request DELETE:/teams/{teamId}/members/{memberId}
     * @secure
     */
    teamControllerRemoveMember: (
      teamId: string,
      memberId: string,
      params: RequestParams = {},
    ) =>
      this.request<RemoveMemberResultDto, void>({
        path: `/teams/${teamId}/members/${memberId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 根据 Supabase 用户ID获取对应的团队成员信息
     *
     * @tags teams
     * @name TeamControllerFindTeamMemberByUserId
     * @summary 根据用户ID获取团队成员
     * @request GET:/teams/by-user-id/{userId}
     * @secure
     */
    teamControllerFindTeamMemberByUserId: (
      userId: string,
      params: RequestParams = {},
    ) =>
      this.request<TeamMemberDto, void>({
        path: `/teams/by-user-id/${userId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  workspaces = {
    /**
     * @description 获取当前用户的所有工作空间，包括个人工作空间和所属团队的工作空间
     *
     * @tags workspaces
     * @name WorkspaceControllerGetUserWorkspaces
     * @summary 获取用户所有工作空间
     * @request GET:/workspaces
     * @secure
     */
    workspaceControllerGetUserWorkspaces: (params: RequestParams = {}) =>
      this.request<WorkspaceDto[], void>({
        path: `/workspaces`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 根据工作空间ID获取详细信息，包括关联的用户或团队信息
     *
     * @tags workspaces
     * @name WorkspaceControllerGetWorkspaceById
     * @summary 获取工作空间详情
     * @request GET:/workspaces/{workspaceId}
     * @secure
     */
    workspaceControllerGetWorkspaceById: (
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<WorkspaceDto, void>({
        path: `/workspaces/${workspaceId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags workflows
     * @name WorkflowControllerCreate
     * @summary 创建工作流
     * @request POST:/workspaces/{workspaceId}/workflows
     * @secure
     */
    workflowControllerCreate: (
      workspaceId: string,
      data: CreateWorkflowDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags workflows
     * @name WorkflowControllerFindAll
     * @summary 获取工作流列表
     * @request GET:/workspaces/{workspaceId}/workflows
     * @secure
     */
    workflowControllerFindAll: (
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags workflows
     * @name WorkflowControllerFindOne
     * @summary 获取工作流详情
     * @request GET:/workspaces/{workspaceId}/workflows/{id}
     * @secure
     */
    workflowControllerFindOne: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags workflows
     * @name WorkflowControllerUpdate
     * @summary 更新工作流
     * @request PATCH:/workspaces/{workspaceId}/workflows/{id}
     * @secure
     */
    workflowControllerUpdate: (
      id: string,
      workspaceId: string,
      data: UpdateWorkflowDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags workflows
     * @name WorkflowControllerRemove
     * @summary 删除工作流
     * @request DELETE:/workspaces/{workspaceId}/workflows/{id}
     * @secure
     */
    workflowControllerRemove: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags workflows
     * @name WorkflowControllerPublish
     * @summary 发布工作流
     * @request POST:/workspaces/{workspaceId}/workflows/{id}/publish
     * @secure
     */
    workflowControllerPublish: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/workflows/${id}/publish`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerCreate
     * @summary 创建任务
     * @request POST:/workspaces/{workspaceId}/issues
     * @secure
     */
    issueControllerCreate: (
      workspaceId: string,
      data: CreateIssueDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerFindAll
     * @summary 获取任务列表
     * @request GET:/workspaces/{workspaceId}/issues
     * @secure
     */
    issueControllerFindAll: (
      workspaceId: string,
      query: {
        projectId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerFindOne
     * @summary 获取任务详情
     * @request GET:/workspaces/{workspaceId}/issues/{id}
     * @secure
     */
    issueControllerFindOne: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerUpdate
     * @summary 更新任务
     * @request PATCH:/workspaces/{workspaceId}/issues/{id}
     * @secure
     */
    issueControllerUpdate: (
      id: string,
      workspaceId: string,
      data: UpdateIssueDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerRemove
     * @summary 删除任务
     * @request DELETE:/workspaces/{workspaceId}/issues/{id}
     * @secure
     */
    issueControllerRemove: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerAddComment
     * @summary 添加评论
     * @request POST:/workspaces/{workspaceId}/issues/{issueId}/comments
     * @secure
     */
    issueControllerAddComment: (
      issueId: string,
      workspaceId: string,
      data: CreateCommentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${issueId}/comments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags issues
     * @name IssueControllerAddDependency
     * @summary 添加依赖
     * @request POST:/workspaces/{workspaceId}/issues/{issueId}/dependencies
     * @secure
     */
    issueControllerAddDependency: (
      issueId: string,
      workspaceId: string,
      data: CreateIssueDependencyDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/issues/${issueId}/dependencies`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerCreate
     * @summary 创建项目
     * @request POST:/workspaces/{workspaceId}/projects
     * @secure
     */
    projectControllerCreate: (
      workspaceId: string,
      data: CreateProjectDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerFindAll
     * @summary 获取工作空间下的所有项目
     * @request GET:/workspaces/{workspaceId}/projects
     * @secure
     */
    projectControllerFindAll: (
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerFindOne
     * @summary 获取项目详情
     * @request GET:/workspaces/{workspaceId}/projects/{id}
     * @secure
     */
    projectControllerFindOne: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerUpdate
     * @summary 更新项目
     * @request PATCH:/workspaces/{workspaceId}/projects/{id}
     * @secure
     */
    projectControllerUpdate: (
      id: string,
      workspaceId: string,
      data: UpdateProjectDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags projects
     * @name ProjectControllerRemove
     * @summary 删除项目
     * @request DELETE:/workspaces/{workspaceId}/projects/{id}
     * @secure
     */
    projectControllerRemove: (
      id: string,
      workspaceId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/workspaces/${workspaceId}/projects/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
}
