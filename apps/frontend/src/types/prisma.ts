// 从Prisma schema生成的前端类型定义

// MARK: 角色
export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

// MARK: 工作空间类型
export enum WorkspaceType {
  PERSONAL = "PERSONAL",
  TEAM = "TEAM",
}

// MARK: 工作流状态
export enum WorkflowStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

// MARK: 项目状态
export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  SHIPPING = "SHIPPING",
  DONE = "DONE",
  ARCHIVED = "ARCHIVED",
}

// MARK: 项目风险等级
export enum ProjectRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// MARK: 任务状态
export enum IssueStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  AMOST_DONE = "AMOST_DONE",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
}

// MARK: Issue 主状态分类
export enum IssueStateCategory {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELED = "CANCELED",
}

// MARK: 任务优先级
export enum IssuePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// MARK: 任务类型
export enum IssueType {
  NORMAL = "NORMAL",
  WORKFLOW = "WORKFLOW",
}

// MARK: 可见权限
export enum VisibilityType {
  PRIVATE = "PRIVATE",
  TEAM_READONLY = "TEAM_READONLY",
  TEAM_EDITABLE = "TEAM_EDITABLE",
  PUBLIC = "PUBLIC",
}

// MARK: Issue 查询范围
export enum IssueScope {
  ALL = "all",
  TEAM = "team",
  PERSONAL = "personal",
}
