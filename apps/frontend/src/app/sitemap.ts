import type { MetadataRoute } from "next";

import {
  ALL_MARKETING_PATHS,
  getMarketingSitemapConfig,
} from "@/lib/marketing-seo";
import { routing } from "@/i18n/routing";
import {
  absoluteUrl,
  getLocaleAlternates,
  getLocalizedPath,
} from "@/lib/seo";

const SITEMAP_DATE = new Date("2026-04-13T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of ALL_MARKETING_PATHS) {
    const { changeFrequency, priority } = getMarketingSitemapConfig(path);

    for (const locale of routing.locales) {
      entries.push({
        url: absoluteUrl(getLocalizedPath(path, locale)),
        lastModified: SITEMAP_DATE,
        changeFrequency,
        priority,
        alternates: {
          languages: getLocaleAlternates(path),
        },
      });
    }
  }

  return entries;
}
