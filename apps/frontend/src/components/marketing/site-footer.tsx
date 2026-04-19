import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface FooterItem {
  label: string;
  href?: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  items: FooterItem[];
}

interface MarketingFooterProps {
  brand?: string;
  description: string;
  copyright: string;
  sections: FooterSection[];
  watermark?: string;
  className?: string;
}

const marketingLogo = "/synaply-logo.png";

function FooterLink({ item }: { item: FooterItem }) {
  if (!item.href) {
    return <span className="text-white/52">{item.label}</span>;
  }

  if (
    item.external ||
    item.href.startsWith("#") ||
    item.href.startsWith("http") ||
    item.href.startsWith("mailto:")
  ) {
    return (
      <a
        href={item.href}
        className="text-white/62 transition hover:text-white"
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noreferrer" : undefined}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className="text-white/62 transition hover:text-white">
      {item.label}
    </Link>
  );
}

export function MarketingFooter({
  brand = "Synaply",
  description,
  copyright,
  sections,
  watermark = "Synaply",
  className,
}: MarketingFooterProps) {
  return (
    <footer
      className={cn(
        "relative overflow-hidden border-t border-white/8 bg-[#040609]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:96px_96px]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_100%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-12">
        <div className="border-t border-white/8 pt-10">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03]">
                  <Image
                    src={marketingLogo}
                    alt={brand}
                    width={28}
                    height={28}
                    sizes="28px"
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                    {brand}
                  </p>
                  <p className="text-sm text-white/42">{description}</p>
                </div>
              </div>

              <p className="text-sm text-white/34">{copyright}</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {sections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <p className="text-sm font-medium text-white/88">{section.title}</p>
                  <div className="space-y-3 text-sm">
                    {section.items.map((item) => (
                      <div key={`${section.title}-${item.label}`}>
                        <FooterLink item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 overflow-hidden pt-8 mb-8">
            <p className="select-none text-center text-[clamp(5rem,21vw,16rem)] font-semibold leading-none tracking-[-0.09em] text-transparent [background-image:linear-gradient(180deg,rgba(255,255,255,0.1)_10%,rgba(255,255,255,0.05)_38%,rgba(255,255,255,0.015)_74%,rgba(255,255,255,0)_100%)] bg-clip-text">
              {watermark}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
