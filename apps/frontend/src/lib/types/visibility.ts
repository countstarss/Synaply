export enum VisibilityType {
  PRIVATE = "PRIVATE",
  TEAM_READONLY = "TEAM_READONLY",
  TEAM_EDITABLE = "TEAM_EDITABLE",
  PUBLIC = "PUBLIC",
}

export interface VisibilityOption {
  value: VisibilityType;
  label: string;
  description: string;
  icon: string;
}

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: VisibilityType.PRIVATE,
    label: "仅自己",
    description: "只有你可以查看和编辑",
    icon: "🔒",
  },
  {
    value: VisibilityType.TEAM_READONLY,
    label: "团队只读",
    description: "团队成员可以查看，但不能编辑",
    icon: "👥",
  },
  {
    value: VisibilityType.TEAM_EDITABLE,
    label: "团队可编辑",
    description: "团队成员可以查看和编辑",
    icon: "✏️",
  },
  {
    value: VisibilityType.PUBLIC,
    label: "公开",
    description: "所有人都可以查看（未来功能）",
    icon: "🌐",
  },
];

export interface ContentWithVisibility {
  id: string;
  creatorId: string;
  visibility: VisibilityType;
}

export interface PermissionContext {
  currentUserId: string;
  currentTeamMemberId: string | null;
  isTeamOwner: boolean;
  isTeamAdmin: boolean;
}

/**
 * 检查用户是否可以查看内容
 */
export function canViewContent(
  content: ContentWithVisibility,
  context: PermissionContext
): boolean {
  // 创建者总是可以查看
  if (content.creatorId === context.currentTeamMemberId) {
    return true;
  }

  // 根据可见性类型判断
  switch (content.visibility) {
    case VisibilityType.PRIVATE:
      return false;
    case VisibilityType.TEAM_READONLY:
    case VisibilityType.TEAM_EDITABLE:
      return context.currentTeamMemberId !== null;
    case VisibilityType.PUBLIC:
      return true;
    default:
      return false;
  }
}

/**
 * 检查用户是否可以编辑内容
 */
export function canEditContent(
  content: ContentWithVisibility,
  context: PermissionContext
): boolean {
  // 创建者总是可以编辑
  if (content.creatorId === context.currentTeamMemberId) {
    return true;
  }

  // 根据可见性类型判断
  switch (content.visibility) {
    case VisibilityType.PRIVATE:
    case VisibilityType.TEAM_READONLY:
      return false;
    case VisibilityType.TEAM_EDITABLE:
      return context.currentTeamMemberId !== null;
    case VisibilityType.PUBLIC:
      return true;
    default:
      return false;
  }
}

/**
 * 检查用户是否可以删除内容
 */
export function canDeleteContent(
  content: ContentWithVisibility,
  context: PermissionContext
): boolean {
  // 只有创建者可以删除
  if (content.creatorId === context.currentTeamMemberId) {
    return true;
  }

  // 团队所有者和管理员可以删除团队内容
  if (content.visibility !== VisibilityType.PRIVATE) {
    return context.isTeamOwner || context.isTeamAdmin;
  }

  return false;
}

/**
 * 检查用户是否可以修改内容的可见性
 */
export function canChangeVisibility(
  content: ContentWithVisibility,
  context: PermissionContext
): boolean {
  // 只有创建者可以修改可见性
  return content.creatorId === context.currentTeamMemberId;
}

/**
 * 获取用户可选的可见性选项
 */
export function getAvailableVisibilityOptions(
  isInTeam: boolean
): VisibilityOption[] {
  if (!isInTeam) {
    // 个人空间只有私有选项
    return VISIBILITY_OPTIONS.filter(
      (option) => option.value === VisibilityType.PRIVATE
    );
  }

  // 团队空间可以选择前3个选项（PUBLIC暂时不开放）
  return VISIBILITY_OPTIONS.filter(
    (option) => option.value !== VisibilityType.PUBLIC
  );
}
