# Infobar 路由过滤配置

## 概述

这个功能允许你配置在哪些路由下不显示 Infobar 组件，提供了灵活的路由匹配方式。

## 配置文件

配置文件位于：`src/config/infobar.config.ts`

## 使用方法

### 1. 基本配置

```typescript
export const infobarConfig: InfobarConfig = {
  // 精确匹配的路由
  hiddenRoutes: [
    '/settings',      // 设置主页
    '/settings/',     // 设置主页（带斜杠）
  ],

  // 前缀匹配的路由
  hiddenPrefixes: [
    '/admin/',        // 所有后台子页面 (/admin/users, /admin/teams 等)
  ],

  // 正则表达式匹配（可选）
  hiddenPatterns: [
    /^\/projects\/\d+$/   // 匹配 /projects/123 这样的路由
  ]
};
```

### 2. 动态添加/移除规则

```typescript
import { addHiddenRoute, removeHiddenRoute } from '@/config/infobar.config';

// 添加精确匹配路由
addHiddenRoute('/settings', 'exact');

// 添加前缀匹配路由
addHiddenRoute('/admin/', 'prefix');

// 添加正则表达式匹配
addHiddenRoute(/^\/user\/\d+\/profile$/, 'pattern');

// 移除规则
removeHiddenRoute('/settings', 'exact');
```

## 匹配类型

### 1. 精确匹配 (exact)
- 完全匹配指定的路由路径
- 示例：`'/settings'` 只匹配 `/settings`，不匹配 `/settings/profile`

### 2. 前缀匹配 (prefix)
- 匹配以指定前缀开头的所有路由
- 示例：`'/admin/'` 匹配 `/admin/users`、`/admin/teams/members` 等

### 3. 正则表达式匹配 (pattern)
- 使用正则表达式进行复杂匹配
- 示例：`/^\/projects\/\d+$/` 匹配 `/projects/123`，但不匹配 `/projects/abc`

## 多语言支持

系统自动处理多语言路由：
- `/en/projects` → `/projects`
- `/zh/settings` → `/settings`
- `/fr/admin/users` → `/admin/users`

配置时只需要指定不带语言前缀的路径。

## 使用示例

### 示例1：隐藏设置和后台页面的 Infobar

```typescript
export const infobarConfig: InfobarConfig = {
  hiddenRoutes: ['/settings'],
  hiddenPrefixes: ['/admin/'],
};
```

这将隐藏以下页面的 Infobar：
- `/en/settings`
- `/zh/admin/users`
- `/en/admin/teams/123`

### 示例2：隐藏管理员和设置页面

```typescript
export const infobarConfig: InfobarConfig = {
  hiddenRoutes: ['/settings', '/profile'],
  hiddenPrefixes: ['/admin/', '/settings/'],
};
```

### 示例3：使用正则表达式

```typescript
export const infobarConfig: InfobarConfig = {
  hiddenPatterns: [
    /^\/projects\/\d+$/,       // 匹配 /projects/123
    /^\/user\/[a-z]+\/edit$/,  // 匹配 /user/john/edit
  ]
};
```

## 在 Layout 中的应用

```typescript
// src/app/[locale]/(main)/layout.tsx
import { shouldHideInfobar } from "@/config/infobar.config";

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const hideInfobar = shouldHideInfobar(pathname);

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 根据路由条件显示/隐藏 Infobar */}
        {!hideInfobar && <Infobar />}
        <main>{children}</main>
      </div>
    </div>
  );
};
```

## 最佳实践

### 1. 组织配置
- 将相关的路由规则分组
- 添加注释说明每个规则的用途

### 2. 性能优化
- 优先使用精确匹配和前缀匹配
- 只在需要复杂模式时使用正则表达式

### 3. 维护性
- 定期检查和清理不再需要的规则
- 使用有意义的注释

### 4. 测试
- 测试添加新路由规则后的表现
- 确认多语言路由的正确处理

## API 参考

### `shouldHideInfobar(path: string): boolean`
检查指定路径是否应该隐藏 Infobar。

### `addHiddenRoute(route: string | RegExp, type?: 'exact' | 'prefix' | 'pattern'): void`
动态添加隐藏路由规则。

### `removeHiddenRoute(route: string | RegExp, type?: 'exact' | 'prefix' | 'pattern'): void`
动态移除隐藏路由规则。

## 故障排除

### 问题：Infobar 在期望隐藏的页面仍然显示
1. 检查路由配置是否正确
2. 确认路径格式（不包含语言前缀）
3. 检查浏览器控制台是否有错误

### 问题：多语言路由匹配异常
1. 确认使用的是不带语言前缀的路径配置
2. 检查语言代码格式是否为两位字母

### 问题：动态路由匹配失效
考虑使用正则表达式或前缀匹配代替精确匹配。 
