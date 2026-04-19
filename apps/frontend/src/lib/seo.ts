import type { Metadata } from "next";

import { ALL_MARKETING_PATHS } from "@/lib/marketing-seo";
import { routing } from "@/i18n/routing";

export type SiteLocale = (typeof routing.locales)[number];

export const SITE_NAME = "Synaply";
export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://synaply.team",
);
export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";
export const DEFAULT_OG_IMAGE_URL = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

const LOCALE_LANGUAGE_MAP: Record<SiteLocale, string> = {
  en: "en",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};

const OPEN_GRAPH_LOCALE_MAP: Record<SiteLocale, string> = {
  en: "en_US",
  zh: "zh_CN",
  ja: "ja_JP",
  ko: "ko_KR",
};

const DEFAULT_SITE_DESCRIPTIONS: Record<"en" | "zh", string> = {
  en: "Synaply helps small remote teams stay aligned with clear execution, visible handoffs, and shared context across projects, issues, workflows, docs, and updates.",
  zh: "Synaply 帮助小型远程团队用更清晰的执行、可见的 handoff，以及贯穿 projects、issues、workflows、docs 和 updates 的共享语境保持同频。",
};

function normalizeSiteUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function isSiteLocale(locale: string): locale is SiteLocale {
  return routing.locales.includes(locale as SiteLocale);
}

export function normalizeSiteLocale(locale: string): SiteLocale {
  return isSiteLocale(locale) ? locale : routing.defaultLocale;
}

export function getDefaultSiteDescription(locale: SiteLocale) {
  return locale === "zh"
    ? DEFAULT_SITE_DESCRIPTIONS.zh
    : DEFAULT_SITE_DESCRIPTIONS.en;
}

export function getLocalizedPath(path: string, locale: SiteLocale) {
  const normalizedPath =
    path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/") {
    return locale === routing.defaultLocale ? "/" : `/${locale}`;
  }

  return locale === routing.defaultLocale
    ? normalizedPath
    : `/${locale}${normalizedPath}`;
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
}

export function getLocaleAlternates(path: string) {
  const alternates: Record<string, string> = {
    "x-default": absoluteUrl(getLocalizedPath(path, routing.defaultLocale)),
  };

  for (const locale of routing.locales) {
    alternates[LOCALE_LANGUAGE_MAP[locale]] = absoluteUrl(
      getLocalizedPath(path, locale),
    );
  }

  return alternates;
}

export function getOpenGraphLocale(locale: SiteLocale) {
  return OPEN_GRAPH_LOCALE_MAP[locale];
}

export function getOpenGraphAlternateLocales(locale: SiteLocale) {
  return routing.locales
    .filter((candidate) => candidate !== locale)
    .map((candidate) => OPEN_GRAPH_LOCALE_MAP[candidate]);
}

export function getBaseSiteMetadata(locale: SiteLocale): Metadata {
  const description = getDefaultSiteDescription(locale);
  const homeUrl = absoluteUrl(getLocalizedPath("/landing", locale));

  return {
    metadataBase: new URL(`${SITE_URL}/`),
    applicationName: SITE_NAME,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      url: homeUrl,
      locale: getOpenGraphLocale(locale),
      alternateLocale: getOpenGraphAlternateLocales(locale),
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} remote collaboration workspace preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
}: {
  locale: SiteLocale;
  path: string;
  title: string;
  description: string;
  keywords?: string[];
}): Metadata {
  const canonicalUrl = absoluteUrl(getLocalizedPath(path, locale));

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      locale: getOpenGraphLocale(locale),
      alternateLocale: getOpenGraphAlternateLocales(locale),
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} remote collaboration workspace preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export function getNoIndexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export function getIndexableMarketingPaths() {
  return [...ALL_MARKETING_PATHS];
}

export function getRobotsDisallowPaths() {
  const disallow = new Set<string>(["/api/"]);
  const nonIndexableAppPaths = [
    "/auth",
    "/auth/callback",
    "/auth/reset-password",
    "/tasks",
    "/projects",
    "/issues",
    "/docs",
    "/inbox",
    "/calendar",
    "/settings",
    "/personal",
    "/workflows",
    "/intelligence",
    "/ai",
  ];

  for (const path of nonIndexableAppPaths) {
    disallow.add(path);
    disallow.add(`${path}/`);

    for (const locale of routing.locales) {
      if (locale === routing.defaultLocale) {
        continue;
      }

      disallow.add(`/${locale}${path}`);
      disallow.add(`/${locale}${path}/`);
    }
  }

  return [...disallow];
}

export function buildOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/synaply-logo.png"),
  };
}

export function buildWebsiteStructuredData({
  locale,
  description,
}: {
  locale: SiteLocale;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(getLocalizedPath("/landing", locale)),
    description,
    inLanguage: LOCALE_LANGUAGE_MAP[locale],
  };
}

export function buildSoftwareApplicationStructuredData({
  locale,
  path,
  description,
  offers,
}: {
  locale: SiteLocale;
  path: string;
  description: string;
  offers?: Array<{
    name: string;
    description: string;
    price?: string;
    priceCurrency?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl(getLocalizedPath(path, locale)),
    description,
    inLanguage: LOCALE_LANGUAGE_MAP[locale],
    offers: offers?.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      url: absoluteUrl(getLocalizedPath("/pricing", locale)),
    })),
  };
}

export function buildAboutPageStructuredData({
  locale,
  description,
}: {
  locale: SiteLocale;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: absoluteUrl(getLocalizedPath("/about", locale)),
    description,
    inLanguage: LOCALE_LANGUAGE_MAP[locale],
    about: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildBreadcrumbStructuredData({
  locale,
  items,
}: {
  locale: SiteLocale;
  items: Array<{
    name: string;
    path: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(getLocalizedPath(item.path, locale)),
    })),
  };
}

export function buildItemListStructuredData({
  locale,
  items,
}: {
  locale: SiteLocale;
  items: Array<{
    name: string;
    path: string;
    description?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(getLocalizedPath(item.path, locale)),
      description: item.description,
    })),
  };
}
