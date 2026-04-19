import { redirect } from "@/i18n/navigation";

import { normalizeSiteLocale } from "@/lib/seo";

interface LegacyAiPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyAiPage({
  params,
  searchParams,
}: LegacyAiPageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
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

  redirect({
    href:
      query.size > 0
        ? `/intelligence?${query.toString()}`
        : "/intelligence",
    locale: normalizeSiteLocale(locale),
  });
}
