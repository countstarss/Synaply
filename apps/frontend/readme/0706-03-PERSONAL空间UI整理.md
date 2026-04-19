我来帮您修改PERSONAL空间的UI。首先让我查看现有的Sidebar和导航配置：
Read file: apps/frontend/src/lib/data/constant.ts

Ran tool

Read file: apps/frontend/src/app/[locale]/(main)/personal/doc/page.tsx

Read file: apps/frontend/src/app/[locale]/(main)/personal/doc/layout.tsx

Read file: apps/frontend/src/components/cache/pages/CachedDocsPage.tsx

现在我来按照您的需求进行修改。首先修改PERSONAL空间的导航逻辑，然后将文档系统复制到CachedDocsPage中。

## 1. 修改PERSONAL空间的导航菜单

首先，让我为PERSONAL空间创建新的导航配置：

现在修改Sidebar组件，根据工作空间类型显示不同的导航菜单：




## 2. 将文档系统复制到CachedDocsPage

现在将personal/doc的文档系统复制到CachedDocsPage.tsx中：

现在让我构建项目来验证修改是否正确：
```bash
pnpm run build
```

## 🎉 **修改完成总结**

我已经成功完成了PERSONAL空间的UI整理，包括以下两个主要修改：

### 🔧 **1. 修改PERSONAL空间的导航逻辑**

#### **创建了专门的导航配置**
- 在`constant.ts`中添加了`personalNavItems`配置
- 包含：Inbox、Tasks、Projects、Docs、Settings 五个顶级路由

#### **修改了Sidebar组件**
- 添加了`useWorkspace`导入和使用
- 根据当前工作空间类型（`currentWorkspace?.type`）显示不同导航：
  - **PERSONAL空间**：显示简化的五个顶级路由，取消team和personal分类
  - **TEAM空间**：保持原有的复杂导航结构

#### **PERSONAL空间导航菜单**
- 📥 **Inbox** - `/inbox`
- ✅ **Tasks** - `/tasks` 
- 📁 **Projects** - `/projects`
- 📝 **Docs** - `/docs`
- ⚙️ **Settings** - `/settings`

### 🔧 **2. 将文档系统复制到CachedDocsPage**

#### **完全重构了CachedDocsPage.tsx**
- 移除了原有的模拟文档展示逻辑
- 复制了`/personal/doc/`的完整文档系统
- 包含了以下功能组件：

#### **文档系统功能**
- 🗂️ **文档管理**：完整的文档创建、编辑、组织功能
- 📑 **文档编辑器**：支持富文本编辑的DocsEditor
- 📁 **文件夹管理**：支持文档分类和文件夹结构
- 🔍 **文档概览**：显示文档统计、分类和最近更新
- 🎯 **快速操作**：快速创建新文档
- 📊 **数据可视化**：显示文档数量和分类统计

#### **UI组件结构**
```
CachedDocsPage
├── DocsProvider (personal workspace)
├── DocsContent
│   ├── DocsSidebar (可折叠)
│   ├── DocsTabs (标签页管理)
│   └── DocsPageContent
│       ├── 文档概览页面
│       ├── DocsEditor (文档编辑)
│       └── FolderIntro (文件夹介绍)
```

### ✅ **功能特点**

#### **PERSONAL空间特色**
- 🎯 **简洁导航**：去除复杂的分类，直接显示核心功能
- 🔄 **智能切换**：根据工作空间类型自动调整UI
- 📱 **响应式设计**：保持良好的移动端体验

#### **文档系统特色**
- 💾 **状态管理**：使用DocsProvider管理文档状态
- 🎨 **美观界面**：统一的设计语言和交互体验  
- ⚡ **性能优化**：React.memo优化和懒加载
- 🔧 **可扩展性**：模块化的组件设计

### 📊 **验证结果**

- ✅ **代码编译成功**：无任何错误
- ✅ **TypeScript类型检查通过**
- ✅ **构建成功**：所有路由正常生成
- ✅ **组件集成完整**：所有依赖正确导入

现在当用户在PERSONAL工作空间时，会看到简洁的五个顶级导航菜单，而文档功能已经完全集成到CachedDocsPage中，提供完整的文档管理体验！🚀