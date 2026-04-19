import { redirect } from "@/i18n/navigation";

import { normalizeSiteLocale } from "@/lib/seo";

interface LegacyAiThreadPageProps {
  params: Promise<{ locale: string; threadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyAiThreadPage({
  params,
  searchParams,
}: LegacyAiThreadPageProps) {
  const [{ locale, threadId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      continue;
    }

    if (value) {
      query.set(key, value);
    }
  }

  const targetPath = `/intelligence/${encodeURIComponent(threadId)}`;

  redirect({
    href: query.size > 0 ? `${targetPath}?${query.toString()}` : targetPath,
    locale: normalizeSiteLocale(locale),
  });
}
