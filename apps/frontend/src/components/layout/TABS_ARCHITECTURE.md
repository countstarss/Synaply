# 📋 标签页架构设计

## 🎯 设计理念

标签页不是通用的导航组件，而是特定于页面内容的分类工具。因此，我们将标签页从通用的InfoBar中移除，放到具体需要的页面中。

## 🏗️ 架构变更

### ❌ 之前的设计（通用标签页）
```
InfoBar (全局)
├── 页面标题
├── 标签页 (所有页面都有)
├── 视图切换
└── 搜索栏
```

### ✅ 新的设计（页面特定标签页）
```
InfoBar (全局，简化)
├── 页面标题  
├── 搜索栏
└── 视图切换

Tasks Page (页面内)
├── 标签页 (任务分类)
└── 任务内容
```

## 📍 组件分布

### InfoBar (全局组件)
**位置**: `src/components/layout/main/Infobar.tsx`
**功能**: 
- ✅ 页面标题 (PageTitle)
- ✅ 搜索栏 (SearchBar) 
- ✅ 视图切换 (ViewToggle)
- ❌ 标签页 (已移除)

### Tasks Page (页面组件)
**位置**: `src/app/[locale]/(main)/tasks/page.tsx`
**功能**:
- ✅ 任务分类标签页 (InfoBarTabs)
- ✅ 任务列表
- ✅ 任务过滤逻辑

## 🎨 视觉层次

```
┌─────────────────────────────────────────┐
│ InfoBar (全局)                          │
│ [标题] [搜索] [视图切换]                 │
├─────────────────────────────────────────┤
│ Tasks Page                              │
│ [My Task] [Assigned] [Todo] [Progress]  │ ← 页面特定标签页
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Task 1 - create new project        │ │
│ │ [todo] [high]                       │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Task 2 - review documentation      │ │
│ │ [progress] [medium]                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔧 实现细节

### 标签页数据结构
```tsx
const tabs = [
  { id: "my-task", label: "My Task" },
  { id: "assigned", label: "Assigned" },
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
];
```

### 任务分类逻辑
```tsx
// 任务包含分类字段
const tasks = [
  {
    id: "1",
    title: "Task 1 - create new project", 
    category: "my-task", // 分类标识
    // ... 其他字段
  }
];

// 根据活动标签过滤
const filteredTasks = tasks.filter(task => task.category === activeTab);
```

### 样式集成
- 使用相同的 `InfoBarTabs` 组件
- 保持一致的颜色和交互效果
- 与InfoBar视觉风格统一

## 📄 页面特定配置

### Tasks Page ✅
- **标签页**: ✅ 任务分类
- **搜索**: ✅ 在InfoBar中
- **视图切换**: ✅ List/Board

### Inbox Page
- **标签页**: ❌ 不需要
- **搜索**: ✅ 在InfoBar中 
- **视图切换**: ❌ 只有列表视图

### Docs Page
- **标签页**: ❌ 不需要
- **搜索**: ✅ 在InfoBar中
- **视图切换**: ✅ Grid/List

## 🚀 扩展性

### 添加新的页面标签页
1. 在页面组件中导入 `InfoBarTabs`
2. 定义页面特定的标签配置
3. 实现过滤逻辑
4. 添加标签页区域到页面布局

```tsx
// 示例：在Projects页面添加标签页
import InfoBarTabs from "@/components/layout/infobar/InfoBarTabs";

const projectTabs = [
  { id: "active", label: "Active Projects" },
  { id: "completed", label: "Completed" }, 
  { id: "archived", label: "Archived" },
];
```

### 自定义InfoBar
```tsx
// 为特定页面自定义InfoBar配置
<InfoBar 
  title="Custom Page"
  showSearch={false}
  showViewToggle={true}
/>
```

## ✅ 优势

1. **更清晰的关注点分离**: 每个页面管理自己的分类逻辑
2. **更好的可维护性**: 标签页逻辑与页面内容紧密相关
3. **更灵活的扩展**: 不同页面可以有不同的标签页需求
4. **更简洁的InfoBar**: 专注于通用的导航和搜索功能
5. **更好的用户体验**: 标签页内容与页面内容直接相关 
