import type { Metadata } from "next";

import AboutPageClient from "@/components/marketing/pages/about-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { MARKETING_PAGE_PATHS } from "@/lib/marketing-seo";
import { getMarketingContent } from "@/lib/marketing-server";
import {
  buildAboutPageStructuredData,
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildPageMetadata,
  buildWebsiteStructuredData,
  normalizeSiteLocale,
} from "@/lib/seo";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = (await getMarketingContent(locale)).seo.pages.about;

  return buildPageMetadata({
    locale,
    path: MARKETING_PAGE_PATHS.about,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const marketing = await getMarketingContent(locale);
  const seo = marketing.seo.pages.about;
  const homeLabel = marketing.seo.shared.homeLabel;

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationStructuredData(),
          buildWebsiteStructuredData({
            locale,
            description: seo.description,
          }),
          buildAboutPageStructuredData({
            locale,
            description: seo.description,
          }),
          buildBreadcrumbStructuredData({
            locale,
            items: [
              { name: homeLabel, path: MARKETING_PAGE_PATHS.landing },
              { name: seo.breadcrumbLabel, path: MARKETING_PAGE_PATHS.about },
            ],
          }),
        ]}
      />
      <AboutPageClient />
    </>
  );
}
