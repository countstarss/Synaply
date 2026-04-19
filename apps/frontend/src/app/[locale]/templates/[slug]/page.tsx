import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingDetailPageClient from "@/components/marketing/pages/marketing-detail-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getDetailPageMetadata, getDetailPageProps } from "@/lib/marketing-route-helpers";
import { MARKETING_DETAIL_SLUGS } from "@/lib/marketing-seo";
import { normalizeSiteLocale } from "@/lib/seo";

interface TemplateDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return MARKETING_DETAIL_SLUGS.templates.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: TemplateDetailPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const metadata = getDetailPageMetadata(
    normalizeSiteLocale(rawLocale),
    "templates",
    slug,
  );

  if (!metadata) {
    notFound();
  }

  return metadata;
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const { page, relatedLinks, shared, structuredData } = getDetailPageProps(
    locale,
    "templates",
    slug,
  );

  if (!page || !structuredData) {
    notFound();
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <MarketingDetailPageClient
        page={page}
        relatedLinks={relatedLinks}
        shared={shared}
      />
    </>
  );
}
