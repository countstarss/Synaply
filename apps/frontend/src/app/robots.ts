import type { MetadataRoute } from "next";

import {
  SITE_URL,
  getIndexableMarketingPaths,
  getRobotsDisallowPaths,
} from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: getIndexableMarketingPaths(),
        disallow: getRobotsDisallowPaths(),
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
