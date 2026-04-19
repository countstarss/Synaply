import { redirect } from "@/i18n/navigation";

import { normalizeSiteLocale } from "@/lib/seo";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  redirect({
    href: "/settings/general",
    locale: normalizeSiteLocale(locale),
  });
}
