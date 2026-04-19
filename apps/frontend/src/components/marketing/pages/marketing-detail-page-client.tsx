"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, MoveRight } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/site-footer";
import { ProductPreview } from "@/components/marketing/product-preview";
import { MarketingShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import type {
  MarketingLinkCard,
  MarketingResourcePage,
  MarketingSharedContent,
} from "@/lib/marketing-resources";
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

interface MarketingDetailPageClientProps {
  page: MarketingResourcePage;
  relatedLinks: MarketingLinkCard[];
  shared: MarketingSharedContent;
}

export default function MarketingDetailPageClient({
  page,
  relatedLinks,
  shared,
}: MarketingDetailPageClientProps) {
  const { user } = useAuth();
  const primaryHref = user ? DEFAULT_POST_LOGIN_ROUTE : AUTH_ROUTE;
  const primaryLabel = user ? shared.primaryCtaLabel : shared.authCtaLabel;

  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
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
                {page.summary}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {page.highlights.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/66"
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

          <motion.div {...revealUp}>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 border-b border-white/8 pb-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/36">
                  {shared.previewEyebrow}
                </p>
                <p className="mt-2 text-sm text-white/62">{shared.previewTitle}</p>
              </div>
              <ProductPreview />
              <p className="mt-5 text-sm leading-7 text-white/58">
                {shared.previewDescription}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div {...revealUp}>
          <SectionHeading
            eyebrow={shared.highlightsLabel}
            title={page.sections[0]?.title ?? page.title}
            description={page.sections[0]?.description ?? page.summary}
          />
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {page.sections.map((section, index) => (
            <motion.div key={section.title} {...revealUp}>
              <CardSpotlight
                className="h-full rounded-none"
                color={index % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)"}
              >
                <div className="relative z-10 flex h-full flex-col gap-5 p-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                      {section.eyebrow}
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-white">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-sm leading-7 text-white/58">
                    {section.description}
                  </p>
                  <div className="space-y-3">
                    {section.bullets.map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-7 text-white/64">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-white/46" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <motion.div className="border border-white/10 bg-white/[0.03] p-6" {...revealUp}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
              {shared.checklistEyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
              {page.checklistTitle}
            </h2>
            <div className="mt-6 space-y-4">
              {page.checklist.map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-7 text-white/62">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-white/46" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...revealUp}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
              {shared.relatedEyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
              {shared.relatedTitle}
            </h2>

            <div className="mt-6 grid gap-4">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">{link.title}</h3>
                    <ArrowRight className="h-4 w-4 text-white/48" />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          className="border border-white/10 bg-white/[0.03] p-6 sm:p-8"
          {...revealUp}
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
            {shared.ctaEyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white">
            {page.ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/58">
            {page.ctaDescription}
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
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
              <Link href="/landing">
                {shared.landingCtaLabel}
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <MarketingFooter
        description={shared.footerDescription}
        copyright={`© ${new Date().getFullYear()} Synaply. All rights reserved.`}
        sections={shared.footerSections}
      />
    </MarketingShell>
  );
}
