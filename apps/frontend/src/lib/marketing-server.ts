import { getMessages } from "next-intl/server";

import {
  extractMarketingMessages,
  type MarketingMessages,
} from "@/lib/marketing-content";

export async function getMarketingContent(
  locale?: string,
): Promise<MarketingMessages> {
  const messages = await getMessages(locale ? { locale } : undefined);
  return extractMarketingMessages(messages);
}
