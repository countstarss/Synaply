"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Layers3,
  MessageSquareMore,
  ShieldCheck,
} from "lucide-react";

import { useMarketingCopy } from "@/components/marketing/site-copy";
import { MarketingShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { EvervaultCard } from "@/components/ui/evervault-card";
import { GlareCard } from "@/components/ui/glare-card";
import { Link } from "@/i18n/navigation";
import { AUTH_ROUTE } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

function PlanGlyph() {
  return (
    <svg
      width="66"
      height="65"
      viewBox="0 0 66 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-white"
    >
      <path
        d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
        stroke="currentColor"
        strokeWidth="15"
        strokeMiterlimit="3.86874"
        strokeLinecap="round"
      />
    </svg>
  );
}

const summaryIcons = {
  workspace: Layers3,
  followUp: MessageSquareMore,
  coordination: ShieldCheck,
} as const;

export default function PricingPageClient() {
  const { pricing } = useMarketingCopy();

  return (
    <MarketingShell current="pricing">
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <motion.div className="space-y-8" {...revealUp}>
            <SectionHeading
              eyebrow={pricing.hero.eyebrow}
              title={
                <span>
                  {pricing.hero.titlePrefix}{" "}
                  <Cover className="text-white">
                    <span>{pricing.hero.titleFocus}</span>
                  </Cover>
                  {pricing.hero.titleSuffix}
                </span>
              }
              description={pricing.hero.description}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              {pricing.included.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/62"
                >
                  {item}
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="h-12 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
            >
              <Link href={AUTH_ROUTE}>
                {pricing.hero.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div {...revealUp}>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    {pricing.planSignal.label}
                  </p>
                  <p className="mt-2 text-sm text-white/62">{pricing.planSignal.description}</p>
                </div>
                <div className="h-32 w-32">
                  <EvervaultCard text="SYNC" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {pricing.summaryCards.map((item) => {
                  // Fallback keeps the page render-safe if localized content drifts from the stable icon keys.
                  const Icon =
                    summaryIcons[item.kind as keyof typeof summaryIcons] ?? Layers3;

                  return (
                    <div
                      key={item.kind}
                      className="border border-white/10 bg-[#090b10] px-4 py-4 text-sm text-white/66"
                    >
                      <div className="mb-3 text-white/74">
                        <Icon className="h-4 w-4" />
                      </div>
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-3">
          {pricing.plans.map((plan) => (
            <motion.div
              key={plan.name}
              {...revealUp}
              className={cn(plan.featured && "lg:-translate-y-3")}
            >
              <div className="relative h-full">
                <div
                  className={cn(
                    "absolute right-4 top-3 z-10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]",
                    plan.featured
                      ? "border border-white/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(191,219,254,0.08))] text-white"
                      : "border border-white/10 bg-[#090b10] text-white/54",
                  )}
                >
                  {plan.badge}
                </div>

                <GlareCard
                  containerClassName="[--radius:28px]"
                  className={cn(
                    "flex min-h-[22rem] flex-col items-center justify-center rounded-[28px] px-6 text-center",
                    plan.featured
                      ? "bg-[linear-gradient(180deg,rgba(7,10,28,0.98),rgba(2,6,23,1))]"
                      : "bg-[#020617]",
                  )}
                >
                  <PlanGlyph />
                  <p className="mt-4 text-xl font-bold text-white">{plan.name}</p>
                  <div className="mt-6">
                    <p className="text-4xl font-semibold tracking-[-0.06em] text-white">
                      {plan.price}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/38">
                      {plan.priceHint}
                    </p>
                  </div>
                  <div className="mt-8 max-w-[16rem] space-y-3">
                    <p className="text-sm leading-7 text-white/62">
                      {plan.summary}
                    </p>
                    <div className="mx-auto h-px w-16 bg-white/10" />
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                      {plan.fitLabel}
                    </p>
                    <Link
                      href={AUTH_ROUTE}
                      className={cn(
                        "group relative inline-flex h-11 w-full items-center justify-center overflow-hidden border px-4 text-sm font-medium text-white transition",
                        plan.featured
                          ? "border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] hover:border-white/28 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))]"
                          : "border-white/12 bg-white/[0.05] hover:border-white/18 hover:bg-white/[0.08]",
                      )}
                    >
                      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-80" />
                      <span className="relative">{pricing.planCta}</span>
                    </Link>
                  </div>
                </GlareCard>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
