export type MarketingPageKey = "landing" | "pricing" | "about";

export interface SiteMetric {
  value: string;
  label: string;
}

export interface CapabilityItem {
  name: string;
  title: string;
  description: string;
}

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
}

export interface SiteCopy {
  tagline: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    returningCta: string;
  };
  metrics: SiteMetric[];
  capabilities: {
    eyebrow: string;
    title: string;
    description: string;
    items: CapabilityItem[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    description: string;
    steps: WorkflowStep[];
  };
  finalCta: {
    eyebrow: string;
    description: string;
    primary: string;
  };
  auth: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    modes: {
      login: {
        title: string;
        description: string;
      };
      register: {
        title: string;
        description: string;
      };
      reset: {
        title: string;
        description: string;
      };
    };
  };
}

export interface MarketingFooterItem {
  label: string;
  href?: string;
  external?: boolean;
}

export interface MarketingFooterSection {
  title: string;
  items: MarketingFooterItem[];
}

export interface MarketingOffer {
  name: string;
  description: string;
  price: string;
  priceCurrency: string;
}

export interface MarketingSeoContent {
  title: string;
  description: string;
  keywords: string[];
  breadcrumbLabel: string;
}

export interface MarketingMessages {
  site: SiteCopy;
  landing: {
    proofSignals: string[];
    canvasWord: string;
    coverPrefix: string;
    coverWord: string;
    coverSuffix: string;
    preview: {
      moduleStrip: string;
      status: string;
    };
    productPreview: {
      workspaceTitle: string;
      workspaceSubtitle: string;
      syncStatus: string;
      execution: {
        eyebrow: string;
        title: string;
        status: string;
        columns: {
          issue: string;
          owner: string;
          state: string;
          doc: string;
        };
        rowHint: string;
        rows: Array<{
          name: string;
          owner: string;
          state: string;
          doc: string;
        }>;
      };
      workflow: {
        eyebrow: string;
        title: string;
        steps: string[];
      };
      context: {
        eyebrow: string;
        title: string;
        snippetEyebrow: string;
        snippetBody: string;
        sharedBy: string;
      };
    };
    workflowPrinciple: {
      label: string;
      text: string;
    };
    structuredFlowLabel: string;
    final: {
      titlePrefix: string;
      titleFocus: string;
      secondaryCta: string;
    };
    footer: {
      copyrightSuffix: string;
      sections: MarketingFooterSection[];
    };
  };
  about: {
    badge: string;
    hero: {
      eyebrow: string;
      titlePrefix: string;
      titleFocus: string;
      titleSuffix: string;
      description: string;
      canvasWord: string;
    };
    story: string[];
    principlesSection: {
      eyebrow: string;
      title: string;
      description: string;
    };
    principles: Array<{
      title: string;
      description: string;
    }>;
    preview: {
      label: string;
      description: string;
      surfaceTag: string;
      imageAlt: string;
      badge: string;
      status: string;
    };
    symbol: {
      label: string;
      description: string;
    };
    closing: string;
  };
  pricing: {
    hero: {
      eyebrow: string;
      titlePrefix: string;
      titleFocus: string;
      titleSuffix: string;
      description: string;
      cta: string;
    };
    included: string[];
    planSignal: {
      label: string;
      description: string;
    };
    summaryCards: Array<{
      kind: "workspace" | "followUp" | "coordination";
      text: string;
    }>;
    plans: Array<{
      name: string;
      featured: boolean;
      price: string;
      priceHint: string;
      summary: string;
      badge: string;
      fitLabel: string;
    }>;
    planCta: string;
    offers: MarketingOffer[];
  };
  seo: {
    shared: {
      homeLabel: string;
    };
    pages: Record<MarketingPageKey, MarketingSeoContent>;
  };
}

type AppMessages = {
  marketing?: MarketingMessages;
};

export function extractMarketingMessages(messages: unknown): MarketingMessages {
  const marketing = (messages as AppMessages).marketing;

  if (!marketing) {
    throw new Error("Missing marketing messages in i18n payload.");
  }

  return marketing;
}
