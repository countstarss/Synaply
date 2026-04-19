"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Blocks,
  FileStack,
  GitBranch,
  GitCompare,
  Layers3,
  MoveRight,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/site-footer";
import { ProductPreview } from "@/components/marketing/product-preview";
import { MarketingShell } from "@/components/marketing/site-shell";
import type {
  MarketingHubPage,
  MarketingLinkCard,
  MarketingSharedContent,
} from "@/lib/marketing-resources";
import type { MarketingCategoryKey } from "@/lib/marketing-seo";
import { AUTH_ROUTE, DEFAULT_POST_LOGIN_ROUTE } from "@/lib/auth-utils";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSpotlight } from "@/components/ui/card-spotlight";

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const categoryIcons: Record<MarketingCategoryKey, typeof Layers3> = {
  features: Layers3,
  "use-cases": Blocks,
  templates: FileStack,
  integrations: GitBranch,
  compare: GitCompare,
};

interface MarketingHubPageClientProps {
  page: MarketingHubPage;
  featuredLinks: MarketingLinkCard[];
  shared: MarketingSharedContent;
}

export default function MarketingHubPageClient({
  page,
  featuredLinks,
  shared,
}: MarketingHubPageClientProps) {
  const { user } = useAuth();
  const primaryHref = user ? DEFAULT_POST_LOGIN_ROUTE : AUTH_ROUTE;
  const primaryLabel = user ? shared.primaryCtaLabel : shared.authCtaLabel;
  const Icon = categoryIcons[page.category];

  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <motion.div className="space-y-7" {...revealUp}>
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60"
            >
              {page.eyebrow}
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">
                {page.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
                {page.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {page.highlights.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/68"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 border border-white/10 bg-transparent px-6 text-sm font-medium text-white/76 hover:bg-white/[0.04] hover:text-white"
              >
                <Link href="/pricing">
                  {shared.pricingCtaLabel}
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div className="space-y-4" {...revealUp}>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex items-center gap-3 border-b border-white/8 pb-4">
                <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/86">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/36">
                    {shared.previewEyebrow}
                  </p>
                  <p className="mt-1 text-sm text-white/62">{shared.previewTitle}</p>
                </div>
              </div>

              <ProductPreview />

              <p className="mt-5 text-sm leading-7 text-white/58">
                {shared.previewDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {page.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="border border-white/10 bg-[#090b10] px-4 py-4"
                >
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/54">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div className="space-y-4" {...revealUp}>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/36">
            {shared.overviewLabel}
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
            {page.ctaTitle}
          </h2>
          <p className="max-w-2xl text-base leading-8 text-white/58">
            {page.ctaDescription}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {featuredLinks.map((link, index) => (
            <motion.div key={link.href} {...revealUp}>
              <CardSpotlight
                className="h-full rounded-none"
                color={index % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)"}
              >
                <Link
                  href={link.href}
                  className="relative z-10 flex h-full flex-col gap-4 p-6"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/36">
                      {page.seo.breadcrumbLabel}
                    </p>
                    <ArrowRight className="h-4 w-4 text-white/48" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{link.title}</h3>
                  <p className="text-sm leading-7 text-white/58">{link.description}</p>
                </Link>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>
      </section>

      <MarketingFooter
        description={shared.footerDescription}
        copyright={`© ${new Date().getFullYear()} Synaply. All rights reserved.`}
        sections={shared.footerSections}
      />
    </MarketingShell>
  );
}
