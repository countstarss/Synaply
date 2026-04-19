import type { Metadata } from "next";

import MarketingHubPageClient from "@/components/marketing/pages/marketing-hub-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getHubPageMetadata, getHubPageProps } from "@/lib/marketing-route-helpers";
import { normalizeSiteLocale } from "@/lib/seo";

interface FeaturesHubPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: FeaturesHubPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  return getHubPageMetadata(normalizeSiteLocale(rawLocale), "features");
}

export default async function FeaturesHubPage({ params }: FeaturesHubPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const { featuredLinks, page, shared, structuredData } = getHubPageProps(
    locale,
    "features",
  );

  return (
    <>
      <JsonLd data={structuredData} />
      <MarketingHubPageClient
        featuredLinks={featuredLinks}
        page={page}
        shared={shared}
      />
    </>
  );
}
