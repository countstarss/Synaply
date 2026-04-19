# Synaply Backend 更改总结

## 概述
本文档总结了在 `apps/backend` 项目中为实现权限管理系统所做的所有关键更改。主要目标是集成 Supabase Auth，并构建用户、团队和工作空间管理模块。

## 核心技术栈
- **Nest.js**: 后端框架
- **Prisma**: ORM，用于与 PostgreSQL 数据库交互
- **Supabase Auth**: 用户认证和会话管理
- **jose**: 用于 JWT 验证

## 更改详情

### 1. Prisma ORM 集成
- **安装与初始化**: 在 `apps/backend` 目录下安装 `prisma` 并执行 `prisma init`。
- **数据库连接配置**: 
    - 在 `apps/backend/.env` 中添加 `DATABASE_URL` (从 `supabase/.env.local` 获取)。
    - `prisma/schema.prisma` 配置 `datasource db` 使用 `postgresql` 和 `env("DATABASE_URL")`。
- **数据库模型定义 (`prisma/schema.prisma`)**: 
    - 定义了 `User`, `Workspace`, `Team`, `TeamMember` 模型。
    - 定义了 `Role` (OWNER, ADMIN, MEMBER) 和 `WorkspaceType` (PERSONAL, TEAM) 枚举。
    - 运行 `pnpm exec prisma migrate dev --name init` 进行数据库迁移，同步模型到 Supabase 数据库。
- **Prisma 模块 (`src/prisma`)**: 
    - `src/prisma/prisma.module.ts`: 封装 `PrismaService`。
    - `src/prisma/prisma.service.ts`: 继承 `PrismaClient`，实现 `OnModuleInit` (`$connect()`) 和 `OnModuleDestroy` (`$disconnect()`) 生命周期钩子，确保数据库连接的正确管理。

### 2. 认证模块 (AuthModule)
- **目录结构**: `src/auth/`
- **依赖安装**: `pnpm add jose`
- **环境变量**: 在 `apps/backend/.env` 中添加 `SUPABASE_URL` 和 `JWT_SECRET` (从 `supabase/.env.local` 获取)。
- **`src/auth/verify-jwt.ts`**: 
    - 负责 JWT 的验证。
    - 使用 `jose` 库的 `jwtVerify` 函数。
    - **关键更改**: 鉴于 Supabase Access Token 默认使用 `HS256` 算法签名，修改为直接使用 `JWT_SECRET` 进行对称验证，而非 `createRemoteJWKSet` (后者适用于非对称算法)。
    - 验证 `issuer` (`${SUPABASE_URL}/auth/v1`)。
- **`src/auth/supabase-auth.guard.ts`**: 
    - 实现 `CanActivate` 接口，作为 Nest.js 的认证守卫。
    - 从请求头中提取 `Bearer` Token。
    - 调用 `verifyJwt` 验证 Token。
    - 成功验证后，将 JWT payload 附加到 `req.user`。
    - **集成用户同步**: 在验证成功后，调用 `AuthService.syncUser` 将 Supabase 用户信息同步到本地数据库的 `users` 表。
- **`src/auth/auth.service.ts`**: 
    - `syncUser(userId: string, email: string)`: 使用 `PrismaService` 的 `upsert` 方法，根据 Supabase 用户 ID 同步或创建用户记录。
    - **新增功能**: 在用户首次同步时，自动为其创建一个 `PERSONAL` 类型的个人工作空间。
- **`src/auth/auth.controller.ts`**: 
    - 暴露 `/auth/me` 接口，受 `SupabaseAuthGuard` 保护，返回 JWT payload。
- **模块导入**: `AuthModule` 导入 `PrismaModule`。

### 3. 用户模块 (UserModule)
- **目录结构**: `src/user/`
- **`src/user/user.service.ts`**: 
    - `findById(id: string)`: 根据用户 ID 从数据库查询用户，**包含关联的 `workspaces` 数据** (`include: { workspaces: true }`)。
    - `update(id: string, data: Partial<User>)`: 更新用户信息。
- **`src/user/user.controller.ts`**: 
    - 暴露 `/users/me` 接口，受 `SupabaseAuthGuard` 保护。
    - 调用 `UserService.findById` 获取数据库中用户的详细信息（包括工作空间）。
- **模块导入**: `UserModule` 导入 `PrismaModule` 和 `AuthModule` (因为 `SupabaseAuthGuard` 依赖 `AuthService`)。

### 4. 应用模块 (AppModule)
- **`src/app.module.ts`**: 
    - 导入 `PrismaModule`, `AuthModule`, `UserModule`。

### 5. 端口配置
- **`src/main.ts`**: 将 Nest.js 应用监听端口从默认 `3000` 修改为 `5678`，以避免与前端应用冲突。

## 测试方法

### 1. 验证用户同步和个人工作空间创建
- **前提**: 确保 Nest.js 服务运行在 `5678` 端口。
- **步骤**: 
    1. 在 Supabase Studio 中注册一个**全新的用户**。
    2. 使用该新用户的凭据，通过浏览器控制台（或 Postman/Insomnia）登录 Supabase Auth，获取其 Access Token。
    3. 使用该 Access Token 调用 Nest.js 后端 `/users/me` 接口：
        ```bash
        curl -X GET \
          http://localhost:5678/users/me \
          -H 'Authorization: Bearer YOUR_NEW_USER_ACCESS_TOKEN'
        ```
- **预期结果**: 
    - 响应 JSON 中应包含用户的详细信息，并且 `workspaces` 数组中应有一个 `type: "PERSONAL"` 的工作空间。
    - 检查 Supabase Studio 的 `public.users` 表，确认新用户已同步。
    - 检查 `public.workspaces` 表，确认已为新用户创建了一个 `PERSONAL` 类型的个人工作空间，并与用户 ID 关联。

### 2. 验证 JWT 认证
- **前提**: Nest.js 服务运行。
- **步骤**: 
    1. 获取一个有效的 Supabase Access Token。
    2. 调用 `/auth/me` 接口：
        ```bash
        curl -X GET \
          http://localhost:5678/auth/me \
          -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
        ```
- **预期结果**: 响应 JSON 应为 Supabase JWT 的 payload。

### 3. 验证错误处理
- **前提**: Nest.js 服务运行。
- **步骤**: 
    1. 调用 `/users/me` 或 `/auth/me` 接口，但不提供 `Authorization` 头，或提供一个无效/过期的 Token。
- **预期结果**: 收到 `401 Unauthorized` 错误响应。

---
