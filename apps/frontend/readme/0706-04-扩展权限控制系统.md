# 权限控制系统 (Visibility & Permissions System)

## 概述

我们构建了一个完整的权限控制系统，将原有的简单布尔值 `isPublishToTeam` 升级为更强大的 `VisibilityType` 枚举系统。该系统提供了细粒度的权限控制，支持不同级别的内容可见性和编辑权限。

## 权限级别

### VisibilityType 枚举

```typescript
enum VisibilityType {
  PRIVATE       // 🔒 仅创建者可见和编辑
  TEAM_READONLY // 👥 团队成员可查看，但只有创建者可编辑  
  TEAM_EDITABLE // ✏️ 团队成员可查看和编辑
  PUBLIC        // 🌐 完全公开（为未来扩展预留）
}
```

### 权限矩阵

| 权限类型 | 创建者 | 团队成员 | 其他用户 |
|----------|--------|----------|----------|
| **PRIVATE** | 查看+编辑+删除 | 无权限 | 无权限 |
| **TEAM_READONLY** | 查看+编辑+删除 | 仅查看 | 无权限 |
| **TEAM_EDITABLE** | 查看+编辑+删除 | 查看+编辑 | 无权限 |
| **PUBLIC** | 查看+编辑+删除 | 查看+编辑 | 查看+编辑 |

## 数据库 Schema 更新

### 修改的模型

所有支持权限控制的模型都包含以下字段：

```prisma
model Project {
  // ... 其他字段
  creator    TeamMember     @relation("CreatedProjects", fields: [creatorId], references: [id])
  creatorId  String         @map("creator_id")
  visibility VisibilityType @default(PRIVATE)
}

model Workflow {
  // ... 其他字段
  creator    TeamMember     @relation("CreatedWorkflows", fields: [creatorId], references: [id])
  creatorId  String         @map("creator_id")
  visibility VisibilityType @default(PRIVATE)
}

model Issue {
  // ... 其他字段
  creator   TeamMember @relation("CreatedIssues", fields: [creatorId], references: [id])
  creatorId String     @map("creator_id")
  visibility VisibilityType @default(PRIVATE)
}
```

## 前端实现

### 核心文件结构

```
src/
├── lib/types/visibility.ts          # 权限类型定义和工具函数
├── hooks/usePermissions.ts          # 权限管理 Hook
├── components/ui/VisibilitySelect.tsx # 权限选择器组件
├── components/examples/CreateProjectForm.tsx # 使用示例
└── lib/fetchers/team.ts             # 更新的 API 接口
```

### 权限检查函数

```typescript
// 检查查看权限
canViewContent(content: ContentWithVisibility, context: PermissionContext): boolean

// 检查编辑权限
canEditContent(content: ContentWithVisibility, context: PermissionContext): boolean

// 检查删除权限
canDeleteContent(content: ContentWithVisibility, context: PermissionContext): boolean

// 检查修改可见性权限
canChangeVisibility(content: ContentWithVisibility, context: PermissionContext): boolean
```

### React Hook 使用

```typescript
const { checkPermissions, availableVisibilityOptions, isInTeam } = usePermissions()

// 检查权限
const canEdit = checkPermissions.canEdit(project)
const canDelete = checkPermissions.canDelete(project)

// 获取可选的可见性选项
const options = availableVisibilityOptions // 根据当前环境自动过滤
```

### UI 组件

#### VisibilitySelect - 权限选择器

```typescript
<VisibilitySelect
  value={formData.visibility}
  onValueChange={(value) => setFormData({ ...formData, visibility: value })}
  disabled={isLoading}
/>
```

#### VisibilityBadge - 权限徽章

```typescript
<VisibilityBadge value={project.visibility} />
```

## 后端实现

### 权限检查类

```typescript
// 创建权限检查器
const checker = createPermissionChecker(context)

// 使用权限检查
if (!checker.canView(content)) {
  throw new UnauthorizedException('无权限查看此内容')
}
```

### 装饰器支持

```typescript
@requirePermission('edit')
async updateProject(@Param('id') id: string, @Body() data: UpdateProjectDto) {
  // 方法实现
}
```

## 使用场景

### 个人空间 (PERSONAL)

- 只显示 `PRIVATE` 选项
- 所有内容默认为私有
- 只有创建者可以查看和编辑

### 团队空间 (TEAM)

- 提供 `PRIVATE`、`TEAM_READONLY`、`TEAM_EDITABLE` 选项
- 创建者可以选择内容的可见性级别
- 团队成员根据可见性级别获得不同权限

## 权限控制流程

1. **内容创建时**：
   - 在个人空间：自动设置为 `PRIVATE`
   - 在团队空间：用户可选择可见性级别

2. **内容访问时**：
   - 系统检查用户身份和内容可见性
   - 根据权限矩阵决定访问权限

3. **权限修改**：
   - 只有创建者可以修改内容的可见性
   - 团队管理员可以删除公开内容

## 特性优势

1. **细粒度控制**：支持查看、编辑、删除等不同级别的权限
2. **灵活性**：创建者可以随时调整内容的可见性
3. **安全性**：私有内容严格隔离，防止未授权访问
4. **可扩展性**：预留了 `PUBLIC` 级别，便于未来扩展
5. **用户体验**：提供直观的权限选择器和状态显示

## 迁移指南

### 从 isPublishToTeam 迁移

旧的布尔值字段映射：
- `isPublishToTeam: false` → `visibility: PRIVATE`
- `isPublishToTeam: true` → `visibility: TEAM_EDITABLE`

### 数据库迁移

```sql
-- 添加新枚举类型
CREATE TYPE "VisibilityType" AS ENUM ('PRIVATE', 'TEAM_READONLY', 'TEAM_EDITABLE', 'PUBLIC');

-- 更新现有表
ALTER TABLE "projects" ADD COLUMN "visibility" "VisibilityType" DEFAULT 'PRIVATE';
ALTER TABLE "workflows" ADD COLUMN "visibility" "VisibilityType" DEFAULT 'PRIVATE';
ALTER TABLE "issues" ADD COLUMN "visibility" "VisibilityType" DEFAULT 'PRIVATE';

-- 迁移现有数据
UPDATE "projects" SET "visibility" = 'TEAM_EDITABLE' WHERE "is_publish_to_team" = true;
UPDATE "workflows" SET "visibility" = 'TEAM_EDITABLE' WHERE "is_publish_to_team" = true;
UPDATE "issues" SET "visibility" = 'TEAM_EDITABLE' WHERE "is_publish_to_team" = true;

-- 删除旧字段
ALTER TABLE "projects" DROP COLUMN "is_publish_to_team";
ALTER TABLE "workflows" DROP COLUMN "is_publish_to_team";
ALTER TABLE "issues" DROP COLUMN "is_publish_to_team";
```

## 未来扩展

1. **更多权限级别**：可以添加更细粒度的权限控制
2. **角色权限**：基于用户角色的权限管理
3. **时间权限**：支持临时权限和过期控制
4. **批量权限**：支持批量修改内容权限
5. **权限继承**：子内容继承父内容的权限设置

这个权限控制系统为应用提供了强大而灵活的权限管理能力，能够满足不同场景下的权限控制需求。 