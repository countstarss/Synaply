import { getBackendBaseUrl } from "@/lib/backend-url";
import { CreateWorkflowIssueDto } from "../fetchers/issue";
import { WorkflowResponse } from "../fetchers/workflow";

/**
 * 准备工作流实例化数据
 * @param workflowResponse 工作流响应数据
 * @param issueTitle Issue标题
 * @param issueDescription Issue描述
 * @param workspaceId 工作空间ID
 * @param dueDate 截止日期
 * @returns 创建工作流Issue的DTO
 */
export function prepareWorkflowInstance(
  workflowResponse: WorkflowResponse,
  issueTitle: string,
  issueDescription?: string,
  workspaceId?: string,
  dueDate?: string
): CreateWorkflowIssueDto {
  return {
    title: issueTitle,
    description: issueDescription,
    workspaceId: workspaceId || workflowResponse.workspaceId,
    dueDate,
    workflowId: workflowResponse.id,
  };
}

/**
 * 从工作流创建Issue
 * @param workflowResponse 工作流响应数据
 * @param issueTitle Issue标题
 * @param issueDescription Issue描述
 * @param token 用户token
 * @param workspaceId 工作空间ID
 * @param dueDate 截止日期
 * @returns Promise<Response>
 */
export async function createWorkflowInstance(
  workflowResponse: WorkflowResponse,
  issueTitle: string,
  issueDescription: string | undefined,
  token: string,
  workspaceId?: string,
  dueDate?: string
): Promise<Response> {
  const issueData = prepareWorkflowInstance(
    workflowResponse,
    issueTitle,
    issueDescription,
    workspaceId,
    dueDate
  );

  return fetch(
    `${getBackendBaseUrl()}/workspaces/${issueData.workspaceId}/issues/workflow`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(issueData),
    }
  );
}
