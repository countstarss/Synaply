import type { Metadata } from "next";

import LandingPageClient from "@/components/marketing/pages/landing-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { MARKETING_PAGE_PATHS } from "@/lib/marketing-seo";
import { getMarketingContent } from "@/lib/marketing-server";
import {
  buildOrganizationStructuredData,
  buildPageMetadata,
  buildSoftwareApplicationStructuredData,
  buildWebsiteStructuredData,
  normalizeSiteLocale,
} from "@/lib/seo";

interface LandingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = (await getMarketingContent(locale)).seo.pages.landing;

  return buildPageMetadata({
    locale,
    path: MARKETING_PAGE_PATHS.landing,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  });
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = (await getMarketingContent(locale)).seo.pages.landing;

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationStructuredData(),
          buildWebsiteStructuredData({
            locale,
            description: seo.description,
          }),
          buildSoftwareApplicationStructuredData({
            locale,
            path: MARKETING_PAGE_PATHS.landing,
            description: seo.description,
          }),
        ]}
      />
      <LandingPageClient />
    </>
  );
}
