"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  LayoutTemplate,
  Layers3,
  MoveRight,
  SquareChartGantt,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useEffect } from "react";

import { MarketingShell } from "@/components/marketing/site-shell";
import {
  MarketingFooter,
  type FooterSection,
} from "@/components/marketing/site-footer";
import { SectionHeading } from "@/components/marketing/section-heading";
import { useMarketingCopy } from "@/components/marketing/site-copy";
import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanvasText } from "@/components/ui/canvas-text";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Cover } from "@/components/ui/cover";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  AUTH_ROUTE,
  DEFAULT_POST_LOGIN_ROUTE,
  getAuthParam,
} from "@/lib/auth-utils";
import { getMarketingResourceBundle } from "@/lib/marketing-resources";
import { normalizeSiteLocale } from "@/lib/seo";
import { Link, useRouter } from "@/i18n/navigation";

const featureIcons = {
  Projects: Layers3,
  Issues: SquareChartGantt,
  Workflows: Workflow,
  Docs: FileText,
} as const;

const landingHeroPreviewImage = {
  src: "/synaply_landing.png",
  width: 1225,
  height: 1307,
} as const;

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LandingPageClient() {
  const { user } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const marketing = useMarketingCopy();
  const copy = marketing.site;
  const landing = marketing.landing;
  const proofSignals = landing.proofSignals;
  const resourceFooterSection =
    getMarketingResourceBundle(normalizeSiteLocale(locale)).shared.footerSections[1];

  const primaryHref = user ? DEFAULT_POST_LOGIN_ROUTE : AUTH_ROUTE;
  const primaryLabel = user ? copy.hero.returningCta : copy.hero.primaryCta;
  const canvasWord = landing.canvasWord;
  const footerSections: FooterSection[] = [
    ...landing.footer.sections.map((section) =>
      section.title === "Access"
        ? {
            ...section,
            items: section.items.map((item, index) =>
              index === 0 ? { ...item, label: primaryLabel, href: primaryHref } : item,
            ),
          }
        : section,
    ),
    {
      title: resourceFooterSection.title,
      items: resourceFooterSection.items,
    },
  ];

  useEffect(() => {
    const hasAuthParams = Boolean(
      getAuthParam("code") ||
        getAuthParam("access_token") ||
        getAuthParam("refresh_token"),
    );

    if (!user || !hasAuthParams) {
      return;
    }

    window.history.replaceState({}, "", window.location.pathname);
    router.replace(DEFAULT_POST_LOGIN_ROUTE);
  }, [router, user]);

  return (
    <MarketingShell current="home">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-18 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-18">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <motion.div className="max-w-2xl space-y-8" {...revealUp}>
            <div className="inline-flex border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/54">
              <EncryptedText
                text={copy.hero.eyebrow}
                encryptedClassName="text-white/18"
                revealedClassName="text-white/54"
                revealDelayMs={18}
                flipDelayMs={20}
              />
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl xl:text-[4.9rem]">
                {copy.hero.title}
              </h1>
              <div className="text-2xl font-medium tracking-[-0.05em] text-white/86 sm:text-3xl">
                <span className="sr-only">{canvasWord}</span>
                <CanvasText
                  text={canvasWord}
                  className="font-medium"
                  backgroundClassName="bg-[#05070b]"
                  colors={["#f5f5f5", "#9ca3af", "#d4d4d8"]}
                  animationDuration={8}
                  lineGap={12}
                  lineWidth={1.2}
                  curveIntensity={36}
                />
              </div>
              <p className="max-w-xl text-base leading-8 text-white/58 sm:text-lg">
                {copy.hero.subtitle}
              </p>
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
                <a href="#capabilities">
                  {copy.hero.secondaryCta}
                  <MoveRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="inline-flex flex-wrap items-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/62">
              <span>{landing.coverPrefix}</span>
              <Cover className="text-white">
                <span className="font-medium tracking-[-0.03em]">
                  {landing.coverWord}
                </span>
              </Cover>
              <span>{landing.coverSuffix}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {proofSignals.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/66"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...revealUp}>
            <CardContainer
              containerClassName="py-0"
              className="w-full"
              tiltDivider={60}
            >
              <CardBody className="h-auto w-full">
                <CardItem translateZ={12} className="w-full">
                  <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#080a0f]/96 shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
                    <Image
                      src={landingHeroPreviewImage.src}
                      alt="Synaply 产品界面预览"
                      width={landingHeroPreviewImage.width}
                      height={landingHeroPreviewImage.height}
                      priority
                      sizes="(min-width: 1024px) 52vw, 100vw"
                      className="block h-auto w-full"
                    />
                  </div>
                </CardItem>
                <CardItem
                  translateX={12}
                  translateY={-10}
                  translateZ={24}
                  className="absolute right-6 top-6 hidden border border-white/10 bg-[#090b10]/92 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/54 xl:block"
                >
                  {landing.preview.moduleStrip}
                </CardItem>
                <CardItem
                  translateX={-10}
                  translateY={10}
                  translateZ={20}
                  className="absolute bottom-6 left-6 hidden border border-white/10 bg-[#090b10]/94 px-3 py-2 text-xs text-white/72 xl:flex xl:items-center xl:gap-2"
                >
                  <span className="h-2 w-2 bg-emerald-200/70" />
                  {landing.preview.status}
                </CardItem>
              </CardBody>
            </CardContainer>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-4 border border-white/10 bg-white/[0.03] p-5 md:grid-cols-3"
          {...revealUp}
        >
          {copy.metrics.map((metric, index) => (
            <div key={metric.label} className="space-y-2">
              <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                {metric.value}
              </p>
              <p className="text-sm leading-6 text-white/52">{metric.label}</p>
              {index < copy.metrics.length - 1 ? (
                <Separator className="mt-4 hidden bg-white/8 md:block" />
              ) : null}
            </div>
          ))}
        </motion.div>
      </section>

      <section
        id="capabilities"
        className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8"
      >
        <motion.div {...revealUp}>
          <SectionHeading
            eyebrow={copy.capabilities.eyebrow}
            title={copy.capabilities.title}
            description={copy.capabilities.description}
          />
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {copy.capabilities.items.map((item, index) => {
            const Icon = featureIcons[item.name as keyof typeof featureIcons] ?? LayoutTemplate;

            return (
              <motion.div key={item.name} {...revealUp}>
                <CardSpotlight
                  className="h-full rounded-none"
                  color={index === 1  ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)"}
                  revealColors={
                    index === 0
                      ? [
                          [230, 230, 230],
                          [148, 163, 184],
                        ]
                      : [
                          [229, 231, 235],
                          [115, 115, 115],
                        ]
                  }
                  animationSpeed={4.5}
                >
                <div className="relative z-10 flex h-full flex-col gap-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/82">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <Badge className="border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.22em] text-white/54">
                        {item.name}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold leading-8 text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-7 text-white/58">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section
        id="workflow"
        className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8"
      >
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
          <motion.div className="space-y-6" {...revealUp}>
            <SectionHeading
              eyebrow={copy.workflow.eyebrow}
              title={copy.workflow.title}
              description={copy.workflow.description}
            />
            <div className="border border-white/10 bg-white/[0.03] p-5 text-sm leading-8 text-white/58">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                {landing.workflowPrinciple.label}
              </p>
              <p className="mt-3">{landing.workflowPrinciple.text}</p>
            </div>
          </motion.div>

          <div className="space-y-4">
            {copy.workflow.steps.map((step) => (
              <motion.div key={step.step} {...revealUp}>
                <div className="grid gap-4 border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[72px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/78">
                      {step.step}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/28">
                      {landing.structuredFlowLabel}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-sm leading-7 text-white/58">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="start"
        className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:pb-20"
      >
        <motion.div {...revealUp}>
          <div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <SectionHeading
              eyebrow={copy.finalCta.eyebrow}
              title={
                <span>
                  {landing.final.titlePrefix}{" "}
                  <Cover className="text-white">
                    <span>{landing.final.titleFocus}</span>
                  </Cover>
                </span>
              }
              description={copy.finalCta.description}
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                <Link href={primaryHref}>
                  {user ? copy.hero.returningCta : copy.finalCta.primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 border border-white/10 px-6 text-sm font-medium text-white/74 hover:bg-white/[0.04] hover:text-white"
              >
                <Link href="/pricing">
                  {landing.final.secondaryCta}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <MarketingFooter
        description={copy.tagline}
        copyright={`© ${new Date().getFullYear()} Synaply. ${landing.footer.copyrightSuffix}`}
        sections={footerSections}
        watermark="Synaply"
      />
    </MarketingShell>
  );
}
