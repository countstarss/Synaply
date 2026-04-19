import type { Metadata } from "next";

import PricingPageClient from "@/components/marketing/pages/pricing-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { MARKETING_PAGE_PATHS } from "@/lib/marketing-seo";
import { getMarketingContent } from "@/lib/marketing-server";
import {
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildPageMetadata,
  buildSoftwareApplicationStructuredData,
  buildWebsiteStructuredData,
  normalizeSiteLocale,
} from "@/lib/seo";

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = (await getMarketingContent(locale)).seo.pages.pricing;

  return buildPageMetadata({
    locale,
    path: MARKETING_PAGE_PATHS.pricing,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  });
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const marketing = await getMarketingContent(locale);
  const seo = marketing.seo.pages.pricing;
  const homeLabel = marketing.seo.shared.homeLabel;
  const offers = marketing.pricing.offers;

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
            path: MARKETING_PAGE_PATHS.pricing,
            description: seo.description,
            offers,
          }),
          buildBreadcrumbStructuredData({
            locale,
            items: [
              { name: homeLabel, path: MARKETING_PAGE_PATHS.landing },
              { name: seo.breadcrumbLabel, path: MARKETING_PAGE_PATHS.pricing },
            ],
          }),
        ]}
      />
      <PricingPageClient />
    </>
  );
}
