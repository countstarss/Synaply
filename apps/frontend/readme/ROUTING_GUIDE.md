# 🚀 Synaply 路由结构指南

## 📁 新的路由结构

### 🏠 根路由重定向
- **`/`** → 自动重定向到 `/main`
- **`/main`** → 自动重定向到 `/main/tasks`

### 🎯 主应用路由 (`/main/*`)
所有主应用功能都在 `/main` 路径下，使用统一的 Sidebar + InfoBar 布局：

```
/main/
├── tasks/          # 任务管理页面 (默认首页) ✨ 包含分类标签页
├── inbox/          # 收件箱页面  
├── chat/           # 聊天页面 (已存在)
├── docs/           # 文档管理页面
└── dashboard/      # 仪表盘 (已存在)
```

### 🌟 Landing Page (`/landing`)
独立的营销/介绍页面，不包含主应用的导航：
- **`/landing`** - 产品介绍和营销页面

### 🔐 认证路由 (`/auth`)
用户认证相关页面 (已存在)

## 🎨 布局组件

### MainLayout (用于 `/main/*`)
- **Sidebar**: 左侧导航栏，包含主要功能导航
- **InfoBar**: 顶部信息栏，智能显示页面标题、搜索、视图切换
- **响应式设计**: 移动端自动折叠为汉堡菜单

### 📋 新的标签页架构

#### ✅ 设计理念
标签页不是通用组件，而是页面特定的内容分类工具：

```
InfoBar (全局，简化)               Tasks Page (页面特定)
├── 智能页面标题                   ├── 任务分类标签页  
├── 通用搜索栏          +          ├── [My Task] [Assigned] [Todo] [Progress]
└── 视图切换器                     └── 过滤后的任务列表
```

#### 📍 实现位置
- **全局InfoBar**: `src/components/layout/main/Infobar.tsx`
- **Tasks标签页**: `src/app/[locale]/(main)/tasks/page.tsx`

### LandingLayout (用于 `/landing`)
- 简洁的全屏布局
- 不包含主应用导航元素

## 🚀 使用示例

### 访问主应用
```
https://your-domain.com/        → 重定向到 /main/tasks
https://your-domain.com/main    → 重定向到 /main/tasks  
https://your-domain.com/main/tasks    → 任务管理页面
https://your-domain.com/main/inbox    → 收件箱页面
https://your-domain.com/main/docs     → 文档页面
```

### 访问Landing页面
```
https://your-domain.com/landing → 产品介绍页面
```

## 🎯 页面功能预览

### 📋 Tasks Page (`/main/tasks`) ✨
- **标签页分类**: My Task, Assigned, Todo, In Progress
- **智能过滤**: 根据选择的标签显示对应任务
- **任务管理**: 创建、编辑、状态管理
- **视图切换**: List/Board视图

### 📬 Inbox Page (`/main/inbox`) 
- 消息列表
- 已读/未读状态
- 星标功能
- 归档和删除

### 📄 Docs Page (`/main/docs`)
- 文档网格视图
- 搜索功能
- 文件夹组织
- 最近访问记录

## 🔧 技术实现

### 路由重定向
```tsx
// app/[locale]/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/main");
}
```

### 智能页面标题
```tsx
// InfoBar组件自动根据路径显示标题
const getPageTitle = (pathname: string) => {
  if (pathname.includes('/tasks')) return 'My Tasks';
  if (pathname.includes('/inbox')) return 'Inbox';
  if (pathname.includes('/docs')) return 'Documents';
  if (pathname.includes('/chat')) return 'Chat';
  return 'Dashboard';
};
```

### 页面标签页实现
```tsx
// tasks/page.tsx 中的标签页
const tabs = [
  { id: "my-task", label: "My Task" },
  { id: "assigned", label: "Assigned" },
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
];

// 根据活动标签过滤任务
const filteredTasks = tasks.filter(task => task.category === activeTab);
```

### 布局组件使用
```tsx
// app/[locale]/main/layout.tsx
import Sidebar from "@/components/layout/main/Sidebar";
import Infobar from "@/components/layout/main/Infobar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <Infobar /> {/* 自动智能配置 */}
        <main>{children}</main>
      </div>
    </div>
  );
}
```

## 🎨 设计特点

### ✨ 统一而灵活的体验
- 所有主应用页面共享相同的基础导航和布局
- 页面特定的功能（如Tasks的分类）在页面内实现
- 一致的设计语言和交互模式

### ✨ 智能化的InfoBar
- 自动根据当前路径显示正确的页面标题
- 通用的搜索和视图切换功能
- 保持简洁，避免功能重复

### ✨ 响应式设计
- 桌面端：完整的侧边栏和信息栏
- 移动端：汉堡菜单和优化布局

### ✨ 深色主题
- 统一的黑色系配色方案
- 自定义的 `app-bg`, `app-content-bg`, `app-border` 颜色
- 所有组件完全支持深色主题

## 🚀 下一步

1. **数据集成**: 连接后端API，实现真实的数据交互
2. **状态管理**: 添加全局状态管理（如Redux或Zustand）
3. **实时功能**: 为Chat和通知添加WebSocket支持
4. **权限控制**: 为不同用户角色添加页面访问权限
5. **国际化**: 为所有新页面添加多语言支持

## 🎯 架构优势

1. **清晰的关注点分离**: 全局功能在InfoBar，页面特定功能在页面内
2. **更好的可维护性**: 标签页逻辑与页面内容紧密相关
3. **更灵活的扩展**: 不同页面可以有不同的分类需求
4. **更简洁的全局组件**: InfoBar专注于通用导航和搜索
5. **更好的用户体验**: 标签页内容与页面内容直接相关

现在你拥有了一个现代、灵活、可扩展的路由和布局系统！🎉 