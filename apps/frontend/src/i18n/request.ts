import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { mergeMessages } from './merge-messages';

export default getRequestConfig(async ({ requestLocale }) => {
  // 验证传入的 locale 参数
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // 使用合并函数加载该语言的所有翻译文件
    messages: await mergeMessages(locale)
  };
}); 