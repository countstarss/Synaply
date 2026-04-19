export type MarketingPageKey = "landing" | "pricing" | "about";

export const MARKETING_PAGE_PATHS: Record<MarketingPageKey, string> = {
  landing: "/landing",
  pricing: "/pricing",
  about: "/about",
};

export type MarketingCategoryKey =
  | "features"
  | "use-cases"
  | "templates"
  | "integrations"
  | "compare";

export const MARKETING_CATEGORY_PATHS: Record<MarketingCategoryKey, string> = {
  features: "/features",
  "use-cases": "/use-cases",
  templates: "/templates",
  integrations: "/integrations",
  compare: "/compare",
};

export const MARKETING_DETAIL_SLUGS: Record<MarketingCategoryKey, string[]> = {
  features: [
    "handoffs",
    "blocker-tracking",
    "decision-log",
    "async-digest",
    "workflow-visibility",
  ],
  "use-cases": [
    "remote-product-teams",
    "design-engineering-handoff",
    "async-release-planning",
  ],
  templates: [
    "product-brief",
    "design-review",
    "release-checklist",
    "decision-log",
  ],
  integrations: ["github", "slack"],
  compare: ["linear-alternative", "notion-vs-synaply-for-execution"],
};

export function getMarketingCategoryPath(category: MarketingCategoryKey) {
  return MARKETING_CATEGORY_PATHS[category];
}

export function getMarketingDetailPath(
  category: MarketingCategoryKey,
  slug: string,
) {
  return `${getMarketingCategoryPath(category)}/${slug}`;
}

export const MARKETING_HUB_PATHS = Object.values(MARKETING_CATEGORY_PATHS);

export const MARKETING_DETAIL_PATHS = Object.entries(MARKETING_DETAIL_SLUGS).flatMap(
  ([category, slugs]) =>
    slugs.map((slug) =>
      getMarketingDetailPath(category as MarketingCategoryKey, slug),
    ),
);

export const ALL_MARKETING_PATHS = [
  ...Object.values(MARKETING_PAGE_PATHS),
  ...MARKETING_HUB_PATHS,
  ...MARKETING_DETAIL_PATHS,
];

export function getMarketingSitemapConfig(path: string) {
  if (path === MARKETING_PAGE_PATHS.landing) {
    return {
      changeFrequency: "weekly" as const,
      priority: 1,
    };
  }

  if (MARKETING_HUB_PATHS.includes(path)) {
    return {
      changeFrequency: "weekly" as const,
      priority: 0.9,
    };
  }

  if (
    path.startsWith(MARKETING_CATEGORY_PATHS.templates) ||
    path.startsWith(MARKETING_CATEGORY_PATHS.compare)
  ) {
    return {
      changeFrequency: "weekly" as const,
      priority: 0.86,
    };
  }

  if (path.startsWith(MARKETING_CATEGORY_PATHS.integrations)) {
    return {
      changeFrequency: "monthly" as const,
      priority: 0.8,
    };
  }

  return {
    changeFrequency: "monthly" as const,
    priority: 0.82,
  };
}
