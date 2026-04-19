import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // 支持的语言列表
  locales: ['en', 'zh', 'ko', 'ja'],
  
  // 默认语言
  defaultLocale: 'en',
  
  // 英文无前缀，其他语言有前缀
  localePrefix: 'as-needed'
}); 