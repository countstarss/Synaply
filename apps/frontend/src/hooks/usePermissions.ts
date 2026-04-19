// import { useMemo } from "react";
// import { useWorkspace } from "./useWorkspace";
// import { useTeam } from "./useTeam";
// import { useAuth } from "@/context/AuthContext";
// import {
//   PermissionContext,
//   ContentWithVisibility,
//   canViewContent,
//   canEditContent,
//   canDeleteContent,
//   canChangeVisibility,
//   getAvailableVisibilityOptions,
// } from "@/lib/types/visibility";

// export function usePermissions() {
//   const { currentWorkspace } = useWorkspace();
//   // const { currentTeamMember } = useTeam();
//   const { session } = useAuth();

//   // 构建权限上下文
//   const permissionContext = useMemo<PermissionContext>(
//     () => ({
//       currentUserId: session?.user?.id || "",
//       currentTeamMemberId: currentTeamMember?.id || null,
//       isTeamOwner: currentTeamMember?.role === "OWNER",
//       isTeamAdmin: currentTeamMember?.role === "ADMIN",
//     }),
//     [currentTeamMember, session?.user?.id]
//   );

//   // 是否在团队环境中
//   const isInTeam = currentWorkspace?.type === "TEAM";

//   // 权限检查函数
//   const checkPermissions = useMemo(
//     () => ({
//       canView: (content: ContentWithVisibility) =>
//         canViewContent(content, permissionContext),

//       canEdit: (content: ContentWithVisibility) =>
//         canEditContent(content, permissionContext),

//       canDelete: (content: ContentWithVisibility) =>
//         canDeleteContent(content, permissionContext),

//       canChangeVisibility: (content: ContentWithVisibility) =>
//         canChangeVisibility(content, permissionContext),
//     }),
//     [permissionContext]
//   );

//   // 获取可用的可见性选项
//   const availableVisibilityOptions = useMemo(
//     () => getAvailableVisibilityOptions(isInTeam),
//     [isInTeam]
//   );

//   return {
//     permissionContext,
//     isInTeam,
//     checkPermissions,
//     availableVisibilityOptions,
//   };
// }
