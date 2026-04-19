# Layout Components 使用指南

这套布局组件基于设计稿构建，具有高度的可扩展性和模块化设计。

## 📁 组件结构

```
src/components/layout/
├── main/
│   ├── Sidebar.tsx          # 主侧边栏组件
│   ├── Infobar.tsx          # 信息栏组件
│   └── MainLayout.tsx       # 主布局组件
├── sidebar/
│   ├── SidebarBrand.tsx     # 品牌标识组件
│   ├── SidebarNavItem.tsx   # 导航项组件
│   ├── SidebarSection.tsx   # 分组组件
│   └── SidebarFooter.tsx    # 底部信息组件
└── infobar/
    ├── InfoBarTabs.tsx      # 标签页组件
    ├── ViewToggle.tsx       # 视图切换组件
    ├── SearchBar.tsx        # 搜索栏组件
    └── PageTitle.tsx        # 页面标题组件
```

## 🎨 组件特点

### Sidebar 组件
- **品牌标识**: 可自定义的Logo和品牌名称
- **主导航**: 支持图标和激活状态
- **分组导航**: 可折叠的分组（WorkSpace、Personal）
- **底部信息**: 品牌信息和标语

### InfoBar 组件
- **页面标题**: 支持主标题和副标题
- **标签页**: 可配置的导航标签
- **视图切换**: List/Board视图切换
- **搜索功能**: 实时搜索支持
- **移动端适配**: 响应式菜单

## 🚀 快速开始

### 1. 基础使用

```tsx
import MainLayout from "@/components/layout/main/MainLayout";

export default function TaskPage() {
  return (
    <MainLayout
      infoBarProps={{
        title: "My Tasks",
        subtitle: "管理你的任务",
        showTabs: true,
        showViewToggle: true,
        showSearch: true,
      }}
    >
      <div>
        {/* 你的页面内容 */}
        <h1>任务列表</h1>
      </div>
    </MainLayout>
  );
}
```

### 2. 独立使用组件

```tsx
import Sidebar from "@/components/layout/main/Sidebar";
import InfoBar from "@/components/layout/main/Infobar";

export default function CustomLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <InfoBar 
          title="自定义页面"
          showTabs={false}
          showViewToggle={false}
        />
        {/* 内容区域 */}
      </div>
    </div>
  );
}
```

## ⚙️ 配置选项

### InfoBar 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | string | "My Task" | 页面标题 |
| `subtitle` | string | - | 页面副标题 |
| `showTabs` | boolean | true | 是否显示标签页 |
| `showViewToggle` | boolean | true | 是否显示视图切换 |
| `showSearch` | boolean | true | 是否显示搜索栏 |
| `className` | string | - | 自定义样式类 |

### Sidebar 属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `className` | string | - | 自定义样式类 |

## 🎯 自定义扩展

### 1. 添加新的导航项

编辑 `Sidebar.tsx` 文件中的 `mainNavItems` 数组：

```tsx
const mainNavItems = [
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: ListCheck, label: "My Task", href: "/tasks" },
  // 添加新项
  { icon: Calendar, label: "Calendar", href: "/calendar" },
];
```

### 2. 自定义标签页

```tsx
const customTabs = [
  { id: "active", label: "活跃任务" },
  { id: "completed", label: "已完成" },
  { id: "archived", label: "已归档" },
];

<InfoBarTabs
  tabs={customTabs}
  activeTab={activeTab}
  onTabChange={handleTabChange}
/>
```

### 3. 扩展搜索功能

```tsx
const handleSearch = (value: string) => {
  // 自定义搜索逻辑
  console.log("搜索:", value);
  // 可以调用API或更新状态
};

<SearchBar
  placeholder="搜索任务..."
  onSearch={handleSearch}
/>
```

## 🎨 主题支持

组件完全支持深色模式，使用 Tailwind CSS 的 `dark:` 前缀：

```tsx
// 自动适配系统主题
<div className="bg-white dark:bg-gray-900">
  <Sidebar />
</div>
```

## 📱 响应式设计

- **桌面端**: 完整显示所有功能
- **平板端**: 保持主要功能，优化布局
- **移动端**: 侧边栏折叠为汉堡菜单，搜索栏收缩

## 🔧 最佳实践

1. **状态管理**: 使用React状态或状态管理库管理标签页和视图状态
2. **路由集成**: 将标签页和导航项与路由系统集成
3. **性能优化**: 大列表使用虚拟化，图标使用懒加载
4. **无障碍**: 确保键盘导航和屏幕阅读器支持

## 🎯 未来扩展

- 支持多语言
- 添加快捷键支持
- 集成通知系统
- 支持拖拽排序
- 添加更多视图类型（表格、卡片等） 