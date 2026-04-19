# 权限管理系统后端实现总结 (第二部分)

## 概述
本文档总结了在 `apps/backend` 项目中，继用户认证和基本信息同步之后，对团队管理和工作空间查询功能的实现细节。所有功能均已通过测试。

## 模块实现详情

### 1. 团队模块 (TeamModule)

**目标**: 实现团队的创建、成员管理和角色分配。

- **文件结构**:
    - `src/team/team.module.ts`
    - `src/team/team.service.ts`
    - `src/team/team.controller.ts`
    - `src/team/dto/create-team.dto.ts`
    - `src/team/dto/invite-member.dto.ts`

- **依赖**: `class-validator`, `class-transformer` (用于 DTO 验证)。

- **`TeamService` 核心功能**:
    - `createTeam(createTeamDto: CreateTeamDto, ownerId: string)`:
        - 创建新团队，并自动为团队创建一个 `TEAM` 类型的 `Workspace`。
        - 将 `ownerId` 对应的用户设置为团队的 `OWNER` 角色。
        - **修复**: 将 `findUnique` 更改为 `findFirst` 以检查团队名称是否存在。
    - `inviteMember(teamId: string, inviteMemberDto: InviteMemberDto, inviterId: string)`:
        - 检查邀请者权限 (需为 `OWNER` 或 `ADMIN`)。
        - 查找被邀请用户，并检查是否已是团队成员。
        - 将被邀请用户添加为 `MEMBER` 角色。
    - `getTeamById(teamId: string)`: 获取团队详情，包含成员和工作空间信息。
    - `getUserTeams(userId: string)`: 获取用户所属的所有团队。
    - `updateMemberRole(teamId: string, memberId: string, newRole: Role, currentUserId: string)`:
        - 检查操作者权限。
        - 处理拥有者降级限制 (不能移除或降级最后一个拥有者)。
    - `removeMember(teamId: string, memberId: string, currentUserId: string)`:
        - 检查操作者权限。
        - 处理拥有者移除限制。

- **`TeamController` API 接口**:
    - 所有接口均受 `SupabaseAuthGuard` 保护。
    - `POST /teams`: 创建团队。
    - `POST /teams/:teamId/invite`: 邀请成员。
    - `GET /teams/:teamId`: 获取特定团队详情。
    - `GET /teams`: 获取当前用户所属的所有团队。
    - `PATCH /teams/:teamId/members/:memberId/role`: 更新成员角色。
    - `DELETE /teams/:teamId/members/:memberId`: 移除成员。

- **模块导入**: `TeamModule` 导入 `PrismaModule`, `AuthModule`, `UserModule`。

### 2. 工作空间模块 (WorkspaceModule)

**目标**: 实现用户工作空间的查询功能，允许用户获取其个人工作空间和所属团队的工作空间。

- **文件结构**:
    - `src/workspace/workspace.module.ts`
    - `src/workspace/workspace.service.ts`
    - `src/workspace/workspace.controller.ts`

- **`WorkspaceService` 核心功能**:
    - `getUserWorkspaces(userId: string)`:
        - 查询用户的 `PERSONAL` 类型工作空间。
        - 查询用户所属团队的 `TEAM` 类型工作空间。
        - 合并并返回所有工作空间列表。
    - `getWorkspaceById(workspaceId: string)`: 根据 ID 获取工作空间详情，包含关联的用户或团队信息。

- **`WorkspaceController` API 接口**:
    - 所有接口均受 `SupabaseAuthGuard` 保护。
    - `GET /workspaces`: 获取当前用户的所有工作空间。
    - `GET /workspaces/:workspaceId`: 获取特定工作空间详情。

- **模块导入**: `WorkspaceModule` 导入 `PrismaModule`, `AuthModule`。

## 整体架构更新

- **`AppModule` (`src/app.module.ts`)**:
    - 导入 `PrismaModule`, `AuthModule`, `UserModule`, `TeamModule`, `WorkspaceModule`，确保所有模块在应用启动时可用。

## 测试结果

- 团队模块和工作空间模块的所有 API 接口均已通过测试，功能正常。
- 用户创建团队时，自动创建团队工作空间并设置拥有者。
- 邀请成员、更新角色、移除成员等操作符合预期。
- 个人工作空间和团队工作空间均可正确查询。

---
