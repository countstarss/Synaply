import { redirect } from "@/i18n/navigation";

import { normalizeSiteLocale } from "@/lib/seo";

// 默认重定向到任务页面
export default async function MainPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  redirect({
    href: "/tasks",
    locale: normalizeSiteLocale(locale),
  });
}
