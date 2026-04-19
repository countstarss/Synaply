import type { Metadata } from "next";

import {
  getMarketingHubPage,
  getMarketingLinkCards,
  getMarketingPagesForCategory,
  getMarketingResourceBundle,
  getMarketingResourcePage,
  type MarketingHubPage,
  type MarketingResourcePage,
  type MarketingSharedContent,
} from "@/lib/marketing-resources";
import { MARKETING_PAGE_PATHS, type MarketingCategoryKey } from "@/lib/marketing-seo";
import {
  buildBreadcrumbStructuredData,
  buildItemListStructuredData,
  buildOrganizationStructuredData,
  buildPageMetadata,
  buildSoftwareApplicationStructuredData,
  buildWebsiteStructuredData,
  type SiteLocale,
} from "@/lib/seo";

export function getHubPageProps(
  locale: SiteLocale,
  category: MarketingCategoryKey,
): {
  page: MarketingHubPage;
  shared: MarketingSharedContent;
  featuredLinks: ReturnType<typeof getMarketingLinkCards>;
  structuredData: Array<Record<string, unknown>>;
} {
  const page = getMarketingHubPage(locale, category);
  const shared = getMarketingResourceBundle(locale).shared;
  const categoryPages = getMarketingPagesForCategory(locale, category);
  const featuredLinks = getMarketingLinkCards(locale, page.featuredPaths);

  return {
    page,
    shared,
    featuredLinks,
    structuredData: [
      buildOrganizationStructuredData(),
      buildWebsiteStructuredData({
        locale,
        description: page.seo.description,
      }),
      buildBreadcrumbStructuredData({
        locale,
        items: [
          { name: shared.homeLabel, path: MARKETING_PAGE_PATHS.landing },
          { name: page.seo.breadcrumbLabel, path: page.path },
        ],
      }),
      buildItemListStructuredData({
        locale,
        items: categoryPages.map((item) => ({
          name: item.seo.breadcrumbLabel,
          path: item.path,
          description: item.cardDescription,
        })),
      }),
    ],
  };
}

export function getHubPageMetadata(
  locale: SiteLocale,
  category: MarketingCategoryKey,
): Metadata {
  const page = getMarketingHubPage(locale, category);

  return buildPageMetadata({
    locale,
    path: page.path,
    title: page.seo.title,
    description: page.seo.description,
    keywords: page.seo.keywords,
  });
}

export function getDetailPageProps(
  locale: SiteLocale,
  category: MarketingCategoryKey,
  slug: string,
): {
  page: MarketingResourcePage | undefined;
  shared: MarketingSharedContent;
  relatedLinks: ReturnType<typeof getMarketingLinkCards>;
  structuredData: Array<Record<string, unknown>> | null;
} {
  const page = getMarketingResourcePage(locale, category, slug);
  const shared = getMarketingResourceBundle(locale).shared;

  if (!page) {
    return {
      page,
      shared,
      relatedLinks: [],
      structuredData: null,
    };
  }

  const hub = getMarketingHubPage(locale, category);

  return {
    page,
    shared,
    relatedLinks: getMarketingLinkCards(locale, page.relatedPaths),
    structuredData: [
      buildOrganizationStructuredData(),
      buildWebsiteStructuredData({
        locale,
        description: page.seo.description,
      }),
      buildSoftwareApplicationStructuredData({
        locale,
        path: page.path,
        description: page.seo.description,
      }),
      buildBreadcrumbStructuredData({
        locale,
        items: [
          { name: shared.homeLabel, path: MARKETING_PAGE_PATHS.landing },
          { name: hub.seo.breadcrumbLabel, path: hub.path },
          { name: page.seo.breadcrumbLabel, path: page.path },
        ],
      }),
    ],
  };
}

export function getDetailPageMetadata(
  locale: SiteLocale,
  category: MarketingCategoryKey,
  slug: string,
): Metadata | null {
  const page = getMarketingResourcePage(locale, category, slug);

  if (!page) {
    return null;
  }

  return buildPageMetadata({
    locale,
    path: page.path,
    title: page.seo.title,
    description: page.seo.description,
    keywords: page.seo.keywords,
  });
}
