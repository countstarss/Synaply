"use client";

import { useMessages } from "next-intl";

import {
  extractMarketingMessages,
  type MarketingMessages,
  type SiteCopy,
} from "@/lib/marketing-content";

export type {
  CapabilityItem,
  MarketingMessages,
  SiteCopy,
  SiteMetric,
  WorkflowStep,
} from "@/lib/marketing-content";

export function useMarketingCopy(): MarketingMessages {
  return extractMarketingMessages(useMessages());
}

export function useSiteCopy(): SiteCopy {
  return useMarketingCopy().site;
}
