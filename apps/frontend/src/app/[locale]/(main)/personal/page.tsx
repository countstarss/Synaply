import { redirect } from "@/i18n/navigation";

import { normalizeSiteLocale } from "@/lib/seo";

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  redirect({
    href: "/personal/doc",
    locale: normalizeSiteLocale(locale),
  });
}
