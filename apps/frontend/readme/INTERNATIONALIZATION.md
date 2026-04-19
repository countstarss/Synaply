# 多语言系统实现文档

本项目已成功集成 next-intl 4.3.1 多语言支持，支持英文、中文、韩语和日语四种语言。

## 🌍 支持的语言

- **English** (en) - 默认语言，无路径前缀
- **中文** (zh) - 路径: `/zh`
- **한국어** (ko) - 路径: `/ko` 
- **日本語** (ja) - 路径: `/ja`

## 📁 项目结构

```
src/
├── i18n/
│   ├── routing.ts       # 路由配置
│   ├── request.ts       # 请求配置
│   └── navigation.ts    # 导航API
├── app/
│   ├── [locale]/        # 本地化页面
│   │   ├── layout.tsx   # 本地化布局
│   │   └── page.tsx     # 主页面
│   └── layout.tsx       # 根布局
├── components/
│   └── LanguageSwitcher.tsx  # 语言切换组件
└── messages/
    ├── en.json          # 英文翻译
    ├── zh.json          # 中文翻译
    ├── ko.json          # 韩语翻译
    └── ja.json          # 日语翻译
```

## ⚙️ 配置文件

### 1. 路由配置 (`src/i18n/routing.ts`)
定义支持的语言列表和路由规则：

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'ko', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'  // 英文无前缀，其他语言有前缀
});
```

### 2. 请求配置 (`src/i18n/request.ts`)
处理消息加载和语言验证：

```typescript
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### 3. 中间件配置 (`src/middleware.ts`)
处理语言路由重定向：

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)' 
};
```

## 🔧 使用方法

### 在组件中使用翻译

```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('home');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

### 语言切换

使用 `LanguageSwitcher` 组件可以在页面上添加语言切换功能：

```typescript
import LanguageSwitcher from '@/components/LanguageSwitcher';

// 在页面中使用
<LanguageSwitcher />
```

### 程序化导航

```typescript
import { useRouter } from '@/i18n/navigation';

const router = useRouter();

// 切换到中文页面
router.push('/dashboard', { locale: 'zh' });
```

## 🌐 访问URL

- 英文（默认）: `http://localhost:3000`
- 中文: `http://localhost:3000/zh`  
- 韩语: `http://localhost:3000/ko`
- 日语: `http://localhost:3000/ja`

## 📝 翻译文件结构

每个语言的翻译文件都包含以下结构：

```json
{
  "common": {
    "loading": "...",
    "email": "...",
    // 通用文本
  },
  "nav": {
    "home": "...",
    "dashboard": "...",
    // 导航文本
  },
  "auth": {
    "login": "...",
    "register": "...",
    // 认证相关文本
  },
  "home": {
    "title": "...",
    "subtitle": "...",
    // 主页文本
  },
  "dashboard": {
    "welcome": "...",
    // 仪表盘文本
  },
  "language": {
    "switch": "...",
    // 语言切换文本
  }
}
```

## ✅ 功能特性

- ✅ 4种语言支持（en, zh, ko, ja）
- ✅ 英文默认无前缀
- ✅ 自动语言检测和重定向
- ✅ 类型安全的翻译
- ✅ 响应式语言切换组件
- ✅ SEO友好的hreflang标签
- ✅ 路由保护和404处理
- ✅ 与Next.js 15完全兼容

## 🔄 添加新语言

1. 在 `src/i18n/routing.ts` 中添加新语言代码
2. 创建对应的翻译文件 `messages/{locale}.json`
3. 在 `LanguageSwitcher.tsx` 中添加语言选项
4. 重启开发服务器

## 🚀 部署注意事项

- 确保所有翻译文件都已完整翻译
- 检查静态构建时的语言文件路径
- 验证所有路由在生产环境中正常工作 