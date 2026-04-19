"use client";

import { motion } from "framer-motion";
import { Layers3, PenTool, Rocket, Workflow } from "lucide-react";
import Image from "next/image";

import { useMarketingCopy } from "@/components/marketing/site-copy";
import { MarketingShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";
import { CanvasText } from "@/components/ui/canvas-text";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Cover } from "@/components/ui/cover";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { EvervaultCard } from "@/components/ui/evervault-card";

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const principleIcons = [Layers3, Workflow, PenTool] as const;

export default function AboutPageClient() {
  const { about } = useMarketingCopy();

  return (
    <MarketingShell current="about">
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <motion.div className="space-y-8" {...revealUp}>
            <div className="inline-flex border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/54">
              <EncryptedText
                text={about.badge}
                encryptedClassName="text-white/18"
                revealedClassName="text-white/54"
                revealDelayMs={18}
                flipDelayMs={20}
              />
            </div>

            <SectionHeading
              eyebrow={about.hero.eyebrow}
              title={
                <span>
                  {about.hero.titlePrefix}{" "}
                  <Cover className="text-white">
                    <span>{about.hero.titleFocus}</span>
                  </Cover>
                  {about.hero.titleSuffix}
                </span>
              }
              description={about.hero.description}
            />

            <div className="text-2xl font-medium tracking-[-0.05em] text-white/82">
              <span className="sr-only">{about.hero.canvasWord}</span>
              <CanvasText
                text={about.hero.canvasWord}
                className="font-medium"
                backgroundClassName="bg-[#05070b]"
                colors={["#f5f5f5", "#a1a1aa", "#d4d4d8"]}
                animationDuration={8}
                lineGap={12}
                lineWidth={1.2}
                curveIntensity={34}
              />
            </div>

            <div className="space-y-3">
              {about.story.map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-white/58">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div {...revealUp}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <CardContainer containerClassName="py-0" className="w-full">
                  <CardBody className="h-auto min-h-[28rem] w-full">
                    <CardItem translateZ={18} className="w-full">
                      <div className="overflow-hidden border border-white/10 bg-[#07090d]">
                        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/32">
                              {about.preview.label}
                            </p>
                            <p className="mt-1 text-sm text-white/64">
                              {about.preview.description}
                            </p>
                          </div>
                          <div className="border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
                            {about.preview.surfaceTag}
                          </div>
                        </div>

                        <div className="relative aspect-[1.08/1] bg-[#05070b]">
                          <Image
                            src="/synaply.png"
                            alt={about.preview.imageAlt}
                            fill
                            priority
                            className="object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0)_0%,rgba(5,7,11,0.08)_62%,rgba(5,7,11,0.4)_100%)]" />
                        </div>
                      </div>
                    </CardItem>

                    <CardItem
                      translateX={18}
                      translateY={-14}
                      translateZ={44}
                      className="absolute right-5 top-5 hidden border border-white/10 bg-[#090b10]/94 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/54 xl:block"
                    >
                      {about.preview.badge}
                    </CardItem>

                    <CardItem
                      translateX={-16}
                      translateY={18}
                      translateZ={38}
                      className="absolute bottom-5 left-5 hidden border border-white/10 bg-[#090b10]/94 px-3 py-2 text-xs text-white/72 xl:flex xl:items-center xl:gap-2"
                    >
                      <span className="h-2 w-2 bg-emerald-200/70" />
                      {about.preview.status}
                    </CardItem>
                  </CardBody>
                </CardContainer>
              </div>

              <div className="border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                  {about.symbol.label}
                </div>
                <div className="mt-4 h-48">
                  <EvervaultCard text="OS" />
                </div>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  {about.symbol.description}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div {...revealUp}>
          <SectionHeading
            eyebrow={about.principlesSection.eyebrow}
            title={about.principlesSection.title}
            description={about.principlesSection.description}
          />
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {about.principles.map((principle, index) => {
            const Icon = principleIcons[index] ?? Layers3;

            return (
            <motion.div key={principle.title} {...revealUp}>
              <CardSpotlight
                className="h-full"
                color={index === 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)"}
                revealColors={
                  index === 1
                    ? [
                        [229, 231, 235],
                        [148, 163, 184],
                      ]
                    : [
                        [235, 235, 235],
                        [110, 110, 110],
                      ]
                }
              >
                <div className="relative z-10 flex h-full flex-col gap-6 p-6">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/82">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {principle.title}
                    </h3>
                    <p className="text-sm leading-7 text-white/58">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </CardSpotlight>
            </motion.div>
            );
          })}
        </div>

        <motion.div className="mt-10 border border-white/10 bg-white/[0.03] p-6" {...revealUp}>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Rocket className="h-4 w-4" />
            {about.closing}
          </div>
        </motion.div>
      </section>
    </MarketingShell>
  );
}
