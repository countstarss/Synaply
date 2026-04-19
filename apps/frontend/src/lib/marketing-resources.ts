import {
  MARKETING_CATEGORY_PATHS,
  MARKETING_PAGE_PATHS,
  getMarketingCategoryPath,
  getMarketingDetailPath,
  type MarketingCategoryKey,
} from "@/lib/marketing-seo";
import type { SiteLocale } from "@/lib/seo";

type MarketingContentLocale = "en" | "zh";

interface MarketingPageSeo {
  title: string;
  description: string;
  keywords: string[];
  breadcrumbLabel: string;
}

interface MarketingHubStat {
  value: string;
  label: string;
}

export interface MarketingPageSection {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface MarketingLinkCard {
  title: string;
  description: string;
  href: string;
}

export interface MarketingHubPage {
  category: MarketingCategoryKey;
  path: string;
  seo: MarketingPageSeo;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  stats: MarketingHubStat[];
  featuredPaths: string[];
  ctaTitle: string;
  ctaDescription: string;
}

export interface MarketingResourcePage {
  category: MarketingCategoryKey;
  slug: string;
  path: string;
  seo: MarketingPageSeo;
  eyebrow: string;
  title: string;
  summary: string;
  cardDescription: string;
  highlights: string[];
  sections: MarketingPageSection[];
  checklistTitle: string;
  checklist: string[];
  relatedPaths: string[];
  ctaTitle: string;
  ctaDescription: string;
}

export interface MarketingSharedContent {
  homeLabel: string;
  overviewLabel: string;
  highlightsLabel: string;
  previewEyebrow: string;
  previewTitle: string;
  previewDescription: string;
  checklistEyebrow: string;
  relatedEyebrow: string;
  relatedTitle: string;
  ctaEyebrow: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  authCtaLabel: string;
  pricingCtaLabel: string;
  landingCtaLabel: string;
  footerDescription: string;
  footerSections: Array<{
    title: string;
    items: Array<{
      label: string;
      href: string;
    }>;
  }>;
  coreLinks: Record<string, MarketingLinkCard>;
}

interface MarketingResourcesDictionary {
  shared: MarketingSharedContent;
  hubs: Record<MarketingCategoryKey, MarketingHubPage>;
  pages: Record<string, MarketingResourcePage>;
}

function resolveMarketingContentLocale(locale: SiteLocale): MarketingContentLocale {
  return locale === "zh" ? "zh" : "en";
}

function createHub(
  category: MarketingCategoryKey,
  data: Omit<MarketingHubPage, "category" | "path">,
): MarketingHubPage {
  return {
    category,
    path: getMarketingCategoryPath(category),
    ...data,
  };
}

function createPage(
  category: MarketingCategoryKey,
  slug: string,
  data: Omit<MarketingResourcePage, "category" | "slug" | "path">,
): MarketingResourcePage {
  return {
    category,
    slug,
    path: getMarketingDetailPath(category, slug),
    ...data,
  };
}

function createSection(
  eyebrow: string,
  title: string,
  description: string,
  bullets: string[],
): MarketingPageSection {
  return {
    eyebrow,
    title,
    description,
    bullets,
  };
}

function createCard(title: string, description: string, href: string): MarketingLinkCard {
  return {
    title,
    description,
    href,
  };
}

const marketingResources: Record<MarketingContentLocale, MarketingResourcesDictionary> = {
  en: {
    shared: {
      homeLabel: "Home",
      overviewLabel: "Execution hub",
      highlightsLabel: "What this page is meant to help with",
      previewEyebrow: "Product surface",
      previewTitle: "Keep the workflow, docs, and ownership in one visible workspace.",
      previewDescription:
        "These pages should lead into a real product surface, not an abstract SEO shell. Synaply keeps projects, issues, workflows, and docs close enough that handoffs stay legible.",
      checklistEyebrow: "Use this when",
      relatedEyebrow: "Related next steps",
      relatedTitle: "Build an internal link path around the same collaboration problem.",
      ctaEyebrow: "Move from scattered follow-up to visible execution",
      primaryCtaLabel: "Open your workspace",
      secondaryCtaLabel: "See the workflow",
      authCtaLabel: "Start with Synaply",
      pricingCtaLabel: "Explore pricing",
      landingCtaLabel: "Back to landing",
      footerDescription:
        "A calmer remote collaboration tool for product, design, engineering, and ops teams.",
      footerSections: [
        {
          title: "Overview",
          items: [
            { label: "Home", href: MARKETING_PAGE_PATHS.landing },
            { label: "Pricing", href: MARKETING_PAGE_PATHS.pricing },
            { label: "About", href: MARKETING_PAGE_PATHS.about },
          ],
        },
        {
          title: "SEO Clusters",
          items: [
            { label: "Features", href: MARKETING_CATEGORY_PATHS.features },
            { label: "Use Cases", href: MARKETING_CATEGORY_PATHS["use-cases"] },
            { label: "Templates", href: MARKETING_CATEGORY_PATHS.templates },
            {
              label: "Integrations",
              href: MARKETING_CATEGORY_PATHS.integrations,
            },
          ],
        },
        {
          title: "High Intent",
          items: [
            {
              label: "Linear alternative",
              href: getMarketingDetailPath("compare", "linear-alternative"),
            },
            {
              label: "Notion vs Synaply",
              href: getMarketingDetailPath(
                "compare",
                "notion-vs-synaply-for-execution",
              ),
            },
            {
              label: "Design review template",
              href: getMarketingDetailPath("templates", "design-review"),
            },
          ],
        },
      ],
      coreLinks: {
        [MARKETING_PAGE_PATHS.landing]: createCard(
          "Remote collaboration software",
          "See the core Synaply positioning and how projects, issues, workflows, and docs fit together.",
          MARKETING_PAGE_PATHS.landing,
        ),
        [MARKETING_PAGE_PATHS.pricing]: createCard(
          "Pricing for focused remote teams",
          "Review packaging for small cross-functional teams that need clear handoffs and steadier execution.",
          MARKETING_PAGE_PATHS.pricing,
        ),
        [MARKETING_PAGE_PATHS.about]: createCard(
          "Why Synaply exists",
          "Understand the product philosophy behind structured execution, visible handoffs, and documentation that stays close to delivery.",
          MARKETING_PAGE_PATHS.about,
        ),
      },
    },
    hubs: {
      features: createHub("features", {
        seo: {
          title: "Workflow Handoff, Blocker Tracking, and Decision Log Features",
          description:
            "Explore Synaply features for cross-role handoffs, blocker tracking, decision logs, async digests, and workflow visibility in remote product teams.",
          keywords: [
            "workflow handoff software",
            "blocker tracking software",
            "decision log software",
            "async digest tool",
            "workflow visibility software",
          ],
          breadcrumbLabel: "Features",
        },
        eyebrow: "Feature hub",
        title: "Execution features for remote teams that need fewer follow-up loops.",
        description:
          "This section explains how Synaply turns handoffs, blockers, decisions, and async updates into visible operating flows instead of scattered messages and private memory.",
        highlights: [
          "Named ownership at each handoff",
          "Visible blockers and restart signals",
          "Docs attached to workflow context",
        ],
        stats: [
          { value: "5", label: "core collaboration features" },
          { value: "3-15", label: "people per ideal team" },
          { value: "1", label: "shared execution surface" },
        ],
        featuredPaths: [
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("features", "blocker-tracking"),
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("features", "async-digest"),
          getMarketingDetailPath("features", "workflow-visibility"),
        ],
        ctaTitle: "Start with the workflows that remove the most chasing.",
        ctaDescription:
          "The most valuable features are the ones that lower coordination drag. Start with handoffs, blockers, and visibility before adding more surface area.",
      }),
      "use-cases": createHub("use-cases", {
        seo: {
          title: "Use Cases for Remote Product, Design, and Engineering Teams",
          description:
            "See how Synaply fits remote product teams, design-to-engineering handoffs, and async release planning for small cross-functional teams.",
          keywords: [
            "remote product team software",
            "design engineering handoff workflow",
            "async release planning",
            "cross functional collaboration tool",
            "small team execution software",
          ],
          breadcrumbLabel: "Use Cases",
        },
        eyebrow: "Use-case hub",
        title: "Concrete collaboration scenarios for small cross-functional teams.",
        description:
          "These pages focus on the moments where remote teams lose momentum: design handoffs, release coordination, and cross-role planning without constant meetings.",
        highlights: [
          "Remote product execution",
          "Design to engineering transitions",
          "Async release coordination",
        ],
        stats: [
          { value: "3", label: "high-intent scenario pages" },
          { value: "4", label: "roles kept in one context" },
          { value: "0", label: "extra status meetings required" },
        ],
        featuredPaths: [
          getMarketingDetailPath("use-cases", "remote-product-teams"),
          getMarketingDetailPath("use-cases", "design-engineering-handoff"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
        ],
        ctaTitle: "Match the page to the team situation, not just the feature label.",
        ctaDescription:
          "Use-case pages work best when they show the full operating context: who is involved, what is blocking momentum, and how work should move next.",
      }),
      templates: createHub("templates", {
        seo: {
          title: "Product Brief, Design Review, and Release Checklist Templates",
          description:
            "Explore template-driven collaboration patterns for product briefs, design reviews, release checklists, and decision logs built for remote execution.",
          keywords: [
            "product brief template",
            "design review template",
            "release checklist template",
            "decision log template",
            "remote team templates",
          ],
          breadcrumbLabel: "Templates",
        },
        eyebrow: "Template hub",
        title: "Templates that reduce reinvention without turning process into bureaucracy.",
        description:
          "Synaply should help teams reuse strong operating patterns. These pages define the structure a good brief, review, checklist, or decision log needs before it becomes productized.",
        highlights: [
          "Reusable structures for recurring collaboration",
          "Templates that stay tied to projects and issues",
          "Clear handoff context from first draft to delivery",
        ],
        stats: [
          { value: "4", label: "priority template pages" },
          { value: "1", label: "execution chain they should map into" },
          { value: "100%", label: "designed for async use" },
        ],
        featuredPaths: [
          getMarketingDetailPath("templates", "product-brief"),
          getMarketingDetailPath("templates", "design-review"),
          getMarketingDetailPath("templates", "release-checklist"),
          getMarketingDetailPath("templates", "decision-log"),
        ],
        ctaTitle: "Start with templates that tighten the collaboration loop.",
        ctaDescription:
          "A template is valuable only when it shortens the path from context to action. Focus on briefs, reviews, release checklists, and decision capture first.",
      }),
      integrations: createHub("integrations", {
        seo: {
          title: "GitHub and Slack Collaboration Integrations for Synaply",
          description:
            "Understand how Synaply fits with GitHub and Slack as a lightweight coordination layer for engineering execution and async team signals.",
          keywords: [
            "GitHub collaboration integration",
            "Slack collaboration integration",
            "GitHub handoff workflow",
            "Slack async updates",
            "lightweight collaboration integrations",
          ],
          breadcrumbLabel: "Integrations",
        },
        eyebrow: "Integration hub",
        title: "Lightweight bridges that support the workflow instead of replacing it.",
        description:
          "Synaply should not become a chat app or a code host. It should connect to the tools teams already use so execution context stays visible while work moves.",
        highlights: [
          "GitHub as engineering execution source",
          "Slack as signal layer, not system of record",
          "Workflow context kept inside Synaply",
        ],
        stats: [
          { value: "2", label: "priority bridge pages" },
          { value: "1", label: "shared coordination layer" },
          { value: "Less", label: "copy-paste status reporting" },
        ],
        featuredPaths: [
          getMarketingDetailPath("integrations", "github"),
          getMarketingDetailPath("integrations", "slack"),
        ],
        ctaTitle: "Keep integrations lightweight and aligned to the product promise.",
        ctaDescription:
          "The best integration work helps a team move faster between tools without turning Synaply into another inbox or another engineering dashboard.",
      }),
      compare: createHub("compare", {
        seo: {
          title: "Linear Alternative and Notion vs Synaply Comparison Pages",
          description:
            "Compare Synaply with Linear and Notion for remote execution, visible handoffs, async coordination, and docs that stay connected to delivery.",
          keywords: [
            "Linear alternative",
            "Notion vs Synaply",
            "remote team collaboration software comparison",
            "execution software comparison",
            "small product team alternative",
          ],
          breadcrumbLabel: "Compare",
        },
        eyebrow: "Compare hub",
        title: "Comparison pages for buyers who already know the problem they want solved.",
        description:
          "These pages target high-intent searches from teams comparing execution tools. The goal is not to attack competitors. It is to explain where Synaply fits best.",
        highlights: [
          "Alternative pages for commercial intent",
          "Positioning based on workflow philosophy",
          "Clear boundaries around who Synaply is for",
        ],
        stats: [
          { value: "2", label: "priority comparison pages" },
          { value: "High", label: "buyer intent level" },
          { value: "Clear", label: "positioning delta required" },
        ],
        featuredPaths: [
          getMarketingDetailPath("compare", "linear-alternative"),
          getMarketingDetailPath("compare", "notion-vs-synaply-for-execution"),
        ],
        ctaTitle: "Use compare pages to sharpen positioning, not to broaden it.",
        ctaDescription:
          "Strong comparison pages make Synaply feel more specific, not more generic. Stay focused on remote execution, handoffs, blockers, and decision context.",
      }),
    },
    pages: {
      "features/handoffs": createPage("features", "handoffs", {
        seo: {
          title: "Workflow Handoff Software for Product, Design, and Engineering Teams",
          description:
            "Use Synaply to make design review, engineering takeover, and operations follow-up visible with named ownership, linked docs, and clear next actions.",
          keywords: [
            "workflow handoff software",
            "design engineering handoff",
            "product engineering handoff",
            "remote team handoff workflow",
            "cross functional handoff tool",
          ],
          breadcrumbLabel: "Handoffs",
        },
        eyebrow: "Feature / Handoffs",
        title: "Make every handoff explicit before work disappears between roles.",
        summary:
          "Synaply is designed for teams that need to request review, hand work to a new owner, and keep the next step visible without relying on side threads or memory.",
        cardDescription:
          "Clarify review ownership, linked docs, and next actions whenever work changes hands.",
        highlights: [
          "Request review without losing context",
          "Keep the next owner and expected action visible",
          "Attach decisions and docs directly to the transition",
        ],
        sections: [
          createSection(
            "Before the handoff",
            "Prepare the next role with enough context to move immediately.",
            "The best handoff is not just a status change. It includes the goal, the current state, the blocking questions, and the doc or artifact that the next role actually needs.",
            [
              "Link the requirement, spec, review note, or release checklist before handing off.",
              "Name the receiving role so ownership becomes explicit instead of implied.",
              "State what “ready” means so the next person is not guessing.",
            ],
          ),
          createSection(
            "During the transition",
            "Make the workflow change visible to everyone who depends on it.",
            "A handoff should update the shared system, not just one conversation. That lets product, design, engineering, and ops see the same movement at the same time.",
            [
              "Use workflow stages that represent real cross-role transitions.",
              "Preserve comments, notes, and linked docs on the same issue or project thread.",
              "Reduce status-check messages by turning the transition into a visible record.",
            ],
          ),
          createSection(
            "After the handoff",
            "Keep the follow-through legible until the next milestone is reached.",
            "Teams lose momentum when a handoff happens once and then vanishes from view. Synaply keeps the resulting state, owner, and next action visible as execution continues.",
            [
              "Show who now owns the work and what they are expected to do next.",
              "Capture review feedback and follow-up decisions close to the item itself.",
              "Use the same context again for the next transition instead of restarting from scratch.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "request product confirmation without spinning up a separate document trail",
          "move a reviewed design into engineering with the right attachments",
          "hand release work to operations without losing the latest decision context",
          "reduce “who owns this now?” questions in remote execution",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("use-cases", "design-engineering-handoff"),
          getMarketingDetailPath("templates", "design-review"),
        ],
        ctaTitle: "Run the next handoff inside one visible workflow.",
        ctaDescription:
          "If transitions are where your team loses time, start by making ownership, linked docs, and next actions explicit in one shared place.",
      }),
      "features/blocker-tracking": createPage("features", "blocker-tracking", {
        seo: {
          title: "Blocker Tracking Software for Remote Product Teams",
          description:
            "Track blockers, dependencies, unblock owners, and expected restart dates in Synaply so remote teams stop discovering delay too late.",
          keywords: [
            "blocker tracking software",
            "dependency tracking for teams",
            "remote team blockers",
            "issue dependency visibility",
            "delivery risk tracking",
          ],
          breadcrumbLabel: "Blocker Tracking",
        },
        eyebrow: "Feature / Blocker tracking",
        title: "Show blocked work, unblock owners, and expected restart dates in one place.",
        summary:
          "Synaply treats blockers as part of execution rather than hidden context. A blocked issue should reveal what it is waiting on, who can unblock it, and when progress is likely to resume.",
        cardDescription:
          "Expose what is blocked, what it depends on, and who is expected to unblock it.",
        highlights: [
          "Visible waiting states instead of silent delay",
          "Named unblock ownership",
          "Restart expectations that reduce chasing",
        ],
        sections: [
          createSection(
            "What a useful blocker record includes",
            "A blocker is only actionable if the system shows more than “stuck.”",
            "When a team says something is blocked, they also need to know what dependency matters, who can move it, and what downstream work is affected.",
            [
              "Record the blocking issue, decision, review, or missing input.",
              "Name the person or role responsible for removing the blocker.",
              "Set an expected next checkpoint so the team knows when to revisit the item.",
            ],
          ),
          createSection(
            "How blocker visibility changes team behavior",
            "A visible blocker reduces status meetings because risk becomes legible before it becomes urgent.",
            "Remote teams lose time when blocked work remains invisible until a deadline slips. Synaply should make waiting states obvious enough that the right person can act early.",
            [
              "Keep blocked work visible in the same list or workflow where active work lives.",
              "Separate “waiting” from “doing” so progress views remain honest.",
              "Tie blockers back to projects and releases so the impact is clear.",
            ],
          ),
          createSection(
            "What unblock follow-up should look like",
            "Unblocking is itself a workflow event, not just a comment.",
            "Once a dependency clears, the team needs the next state, the next owner, and the next action to become visible immediately so momentum can resume.",
            [
              "Update the item when the blocker clears instead of leaving recovery implicit.",
              "Preserve the blocker history for retrospectives and planning review.",
              "Use blocker patterns to spot recurring workflow friction across teams.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "see which issues are blocked without asking around in chat",
          "separate delay caused by dependency from delay caused by ownership drift",
          "capture who should unblock an item and when progress is expected to restart",
          "make delivery risk visible earlier in the workflow",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
          getMarketingDetailPath("templates", "release-checklist"),
        ],
        ctaTitle: "Make waiting visible before delivery slips.",
        ctaDescription:
          "The fastest blocker fix is often just making the dependency, owner, and expected restart date visible in the same workflow everyone already trusts.",
      }),
      "features/decision-log": createPage("features", "decision-log", {
        seo: {
          title: "Decision Log Software for Product and Engineering Teams",
          description:
            "Capture what was decided, why it changed, and which project, issue, or doc it belongs to with a decision log designed for remote execution.",
          keywords: [
            "decision log software",
            "product decision log",
            "engineering decision log",
            "remote team decision tracking",
            "decision records for projects",
          ],
          breadcrumbLabel: "Decision Log",
        },
        eyebrow: "Feature / Decision log",
        title: "Keep the decision, the rationale, and the affected work tied together.",
        summary:
          "Synaply should preserve not just what teams decided, but why, where the decision applies, and what execution surface it changed. That turns docs into active context instead of archive material.",
        cardDescription:
          "Capture decision context beside the project, issue, workflow, or release work it changed.",
        highlights: [
          "Record the why, not just the outcome",
          "Link each decision to real execution objects",
          "Reduce repeated debates across handoffs",
        ],
        sections: [
          createSection(
            "A good decision log entry is specific",
            "Useful decision records say more than “approved” or “changed.”",
            "They capture the context, tradeoff, owner, and impact so someone joining the project later can understand what changed and why the team took that path.",
            [
              "Summarize the decision in one clear sentence.",
              "Record the reasoning, assumptions, and tradeoffs behind it.",
              "Attach the decision to the relevant project, issue, or doc.",
            ],
          ),
          createSection(
            "Decision logs are handoff infrastructure",
            "Cross-role work breaks when rationale lives only in meetings or chat history.",
            "Design, engineering, and operations can move faster when the current answer and its reasoning travel with the work instead of being re-explained on every transition.",
            [
              "Link decision notes inside review and handoff flows.",
              "Use decision logs to explain state changes or scope changes.",
              "Keep decision history close enough that it can shape the next action.",
            ],
          ),
          createSection(
            "Logs should make future review easier",
            "Decision history is only valuable if it can be revisited quickly.",
            "Teams need to see which decisions are still active, which were superseded, and what follow-up work they triggered. That makes retrospectives and planning cleaner.",
            [
              "Mark superseded or revisited decisions explicitly.",
              "Reference the downstream work that came from each decision.",
              "Use decision patterns to improve templates and workflow rules over time.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "stop reopening the same rationale on every project handoff",
          "keep scope changes attached to the work they affect",
          "document approvals and tradeoffs without creating a separate archive flow",
          "make onboarding into an in-flight project faster and calmer",
        ],
        relatedPaths: [
          getMarketingDetailPath("templates", "decision-log"),
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("use-cases", "remote-product-teams"),
        ],
        ctaTitle: "Capture rationale where execution can actually use it.",
        ctaDescription:
          "The most useful decision log is one the next owner sees at the exact moment they need context to move the work forward.",
      }),
      "features/async-digest": createPage("features", "async-digest", {
        seo: {
          title: "Async Digest and Weekly Update Workflow for Remote Teams",
          description:
            "Summarize project progress, workflow movement, risks, and pending confirmations with an async digest designed for remote product teams.",
          keywords: [
            "async digest",
            "weekly project update",
            "remote team digest",
            "async status update workflow",
            "project progress summary",
          ],
          breadcrumbLabel: "Async Digest",
        },
        eyebrow: "Feature / Async digest",
        title: "Turn noisy status updates into one concise operating rhythm.",
        summary:
          "Synaply should help teams publish a digest that answers what moved, what is blocked, what needs attention, and which confirmations are still pending without another meeting.",
        cardDescription:
          "Summarize progress, risk, and pending confirmations in one async update cycle.",
        highlights: [
          "One concise update instead of fragmented pings",
          "Progress, blockers, and approvals in one read",
          "A repeatable rhythm for remote teams",
        ],
        sections: [
          createSection(
            "What a useful digest should cover",
            "A digest should reduce ambiguity, not generate more reading.",
            "Good updates focus on movement, risk, and decisions that need attention. They do not try to restate every comment or every task change from the week.",
            [
              "Summarize what changed across projects, workflows, and docs.",
              "Highlight blockers, pending confirmations, and schedule risk.",
              "End with the small set of actions that matter next.",
            ],
          ),
          createSection(
            "Why digest beats notification sprawl",
            "Remote teams do not need more signals. They need better batching.",
            "When important movement is collected into a single rhythm, stakeholders can stay aligned without monitoring every thread in real time.",
            [
              "Reduce duplicate updates across chat, docs, and ticket comments.",
              "Give each role one reliable place to catch up asynchronously.",
              "Make the state of the team visible even when calendars are misaligned.",
            ],
          ),
          createSection(
            "How to tie digest back to the workflow",
            "The strongest digest is generated from real execution objects, not manual memory.",
            "If projects, issues, blockers, and decisions already live in one operating context, the digest becomes lighter to produce and more trustworthy to read.",
            [
              "Pull update signals from project and workflow changes instead of rewriting them by hand.",
              "Reference pending confirmations and blocker owners directly.",
              "Link the digest back to the pages and issues that need action.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "replace recurring status meetings with a better async rhythm",
          "summarize what changed across multiple roles without writing a long memo",
          "surface open risks and pending approvals before they stall the week",
          "help stakeholders catch up without monitoring every channel",
        ],
        relatedPaths: [
          getMarketingDetailPath("templates", "release-checklist"),
          getMarketingDetailPath("features", "blocker-tracking"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
        ],
        ctaTitle: "Build a digest rhythm from real execution, not memory.",
        ctaDescription:
          "A strong async digest should feel like the team’s operating summary, not another writing assignment layered on top of the work.",
      }),
      "features/workflow-visibility": createPage("features", "workflow-visibility", {
        seo: {
          title: "Workflow Visibility Software for Cross-Functional Teams",
          description:
            "Make stages, owners, transitions, and delivery risk visible across product, design, engineering, and ops with workflow visibility built for remote teams.",
          keywords: [
            "workflow visibility software",
            "cross functional workflow tool",
            "workflow transparency for remote teams",
            "delivery visibility software",
            "workflow status visibility",
          ],
          breadcrumbLabel: "Workflow Visibility",
        },
        eyebrow: "Feature / Workflow visibility",
        title: "Let the whole team see where work stands without asking for a recap.",
        summary:
          "Synaply is most useful when workflow state reflects reality: who owns a stage, what is waiting, what is blocked, and what needs to happen next across the full execution chain.",
        cardDescription:
          "Expose stages, owners, and risk so teams can move work without repeated status checks.",
        highlights: [
          "Shared visibility across roles and stages",
          "Less hidden work between tools and meetings",
          "A truer picture of delivery risk",
        ],
        sections: [
          createSection(
            "Visibility starts with stage design",
            "Workflow visibility is only as good as the stages it exposes.",
            "If states are too vague or too generic, they will not explain whether work is being reviewed, blocked, waiting on another role, or genuinely ready to move.",
            [
              "Use stages that represent real collaboration transitions.",
              "Distinguish active progress from waiting and blocked states.",
              "Keep the stage model simple enough that the team will trust it.",
            ],
          ),
          createSection(
            "Ownership should be visible at each stage",
            "Teams need to know not just where work is, but who can move it now.",
            "This matters most in remote teams where the next person may not be online when the state changes. Clear stage ownership prevents the work from stalling in silence.",
            [
              "Show stage owner and current issue owner together when they differ.",
              "Make expected next actions visible in the same view.",
              "Use linked docs and decision notes to explain why the item is in that state.",
            ],
          ),
          createSection(
            "Visibility should reduce meetings, not just redraw them",
            "The point of visibility is faster self-serve understanding.",
            "When everyone can scan the workflow and immediately spot risk, teams need fewer ad hoc follow-ups, fewer “quick syncs,” and fewer recap messages.",
            [
              "Use the workflow to spot bottlenecks before they become escalations.",
              "Pair workflow views with blocker and digest views for stronger context.",
              "Treat workflow as the operating surface, not a decorative board.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "see real execution state across product, design, engineering, and ops",
          "reduce status-chasing and recap requests in remote work",
          "make waiting states and handoffs visible across multiple roles",
          "spot bottlenecks before delivery commitments drift",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("features", "blocker-tracking"),
          getMarketingDetailPath("use-cases", "remote-product-teams"),
        ],
        ctaTitle: "Use workflow visibility to create momentum, not ceremony.",
        ctaDescription:
          "The best workflow view is one that helps every role understand the current state and act without waiting for another explanation.",
      }),
      "use-cases/remote-product-teams": createPage(
        "use-cases",
        "remote-product-teams",
        {
          seo: {
            title: "Remote Product Team Software for Small Cross-Functional Teams",
            description:
              "Synaply helps 3 to 15 person remote product teams align projects, issues, workflows, docs, blockers, and async updates in one shared execution context.",
            keywords: [
              "remote product team software",
              "small cross functional team tool",
              "remote execution software",
              "product design engineering collaboration",
              "async collaboration platform",
            ],
            breadcrumbLabel: "Remote Product Teams",
          },
          eyebrow: "Use case / Remote product teams",
          title: "For small remote product teams that need a calmer collaboration tool.",
          summary:
            "Synaply fits teams that are too collaborative for simple task lists and too focused to want a bloated project-management suite. It is meant for product, design, engineering, and ops moving in one project context.",
          cardDescription:
            "A tighter remote collaboration tool for 3-15 person product, design, engineering, and ops teams.",
          highlights: [
            "One operating context across core roles",
            "Less meeting-driven coordination",
            "Structured execution without heavy enterprise process",
          ],
          sections: [
            createSection(
              "What this team shape usually struggles with",
              "Small remote teams do not need more tools. They need fewer seams between them.",
              "The problem is rarely lack of tickets. It is loss of context between projects, issues, docs, reviews, blockers, and updates as work moves across roles.",
              [
                "Product context often starts in one place and lands somewhere else by the time engineering sees it.",
                "Docs and decisions drift away from the items they influence.",
                "Progress becomes dependent on follow-up habits instead of workflow design.",
              ],
            ),
            createSection(
              "Why Synaply fits this operating style",
              "Synaply is designed for teams that want more clarity, not more modules.",
              "The product shape is deliberately narrow: projects define scope, issues move work, workflows show transitions, docs preserve rationale, and inbox-style surfaces explain what changed.",
              [
                "Keep project scope and delivery movement in one connected chain.",
                "Make cross-role handoffs visible instead of implicit.",
                "Create a better async rhythm through blocker and digest patterns.",
              ],
            ),
            createSection(
              "Who this is not for",
              "Synaply should feel focused, not universal.",
              "Teams looking for built-in chat, heavy resource planning, or giant configuration surfaces are likely better served elsewhere. The product wins by helping a small cross-functional team move work more naturally.",
              [
                "Not ideal for enterprise planning-heavy environments.",
                "Not intended to replace chat as the center of communication.",
                "Best when the team values momentum, clarity, and visible handoffs.",
              ],
            ),
          ],
          checklistTitle: "Use this page when your team needs to:",
          checklist: [
            "connect product, design, engineering, and ops in one project context",
            "reduce repeat status checks across a small distributed team",
            "make blockers, handoffs, and decisions visible without extra meetings",
            "choose a more focused alternative to generic project management suites",
          ],
          relatedPaths: [
            getMarketingDetailPath("features", "handoffs"),
            getMarketingDetailPath("templates", "product-brief"),
            getMarketingDetailPath("compare", "linear-alternative"),
          ],
          ctaTitle: "Build a calmer operating rhythm for the whole team.",
          ctaDescription:
            "If your team is spending too much energy stitching together tools and follow-ups, start with software that keeps execution context intact from project to delivery.",
        },
      ),
      "use-cases/design-engineering-handoff": createPage(
        "use-cases",
        "design-engineering-handoff",
        {
          seo: {
            title: "Design to Engineering Handoff Workflow for Remote Teams",
            description:
              "Use Synaply to structure design-to-engineering handoffs with review notes, linked docs, ownership, and next-step visibility in one workflow.",
            keywords: [
              "design engineering handoff",
              "remote design handoff workflow",
              "design review to engineering",
              "cross functional handoff process",
              "design delivery workflow",
            ],
            breadcrumbLabel: "Design to Engineering Handoff",
          },
          eyebrow: "Use case / Design to engineering handoff",
          title: "Keep design handoff clear enough that engineering can move without a recap call.",
          summary:
            "This use case fits teams where designs, comments, acceptance notes, and decision context frequently scatter across files, chat, and issue trackers before engineering can start confidently.",
          cardDescription:
            "A cross-role handoff pattern for reviewed designs, linked rationale, and clear next ownership.",
          highlights: [
            "Reviewed design context that stays attached to the work",
            "Explicit takeover from design to engineering",
            "Fewer recap meetings before implementation starts",
          ],
          sections: [
            createSection(
              "What usually breaks in this handoff",
              "Teams often assume a reviewed design is enough. It rarely is.",
              "Engineering also needs acceptance context, tradeoffs, open questions, and the latest decision changes. Without that package, implementation starts with uncertainty or another meeting.",
              [
                "Comments live in one place, rationale in another, and the issue in a third.",
                "Ownership changes are implied instead of recorded.",
                "Engineering spends the first day reconstructing what was already decided.",
              ],
            ),
            createSection(
              "What the handoff package should include",
              "A strong design-to-engineering handoff is a compact operating packet.",
              "The receiving role should understand what is being built, what changed, what is still open, and what level of implementation fidelity matters before touching the ticket.",
              [
                "Link design files, decision notes, and issue scope together.",
                "Record what is approved, what is pending, and what should escalate.",
                "Clarify who owns the next move once the design is handed off.",
              ],
            ),
            createSection(
              "How Synaply should support the transition",
              "The value is not another comment feed. It is one visible state change with attached context.",
              "Synaply should help teams keep the workflow transition, the issue record, and the supporting docs inside the same operating chain so implementation can begin with less friction.",
              [
                "Use a visible workflow stage for design-ready and engineering-ready transitions.",
                "Attach the review summary or decision log to the issue before handoff.",
                "Use follow-up items for anything engineering should verify after implementation starts.",
              ],
            ),
          ],
          checklistTitle: "Use this page when your team needs to:",
          checklist: [
            "move from reviewed design to implementation without losing rationale",
            "give engineering a clear takeover point with the right artifacts attached",
            "capture post-review decisions before code work begins",
            "reduce repeated clarification meetings between design and engineering",
          ],
          relatedPaths: [
            getMarketingDetailPath("features", "handoffs"),
            getMarketingDetailPath("templates", "design-review"),
            getMarketingDetailPath("features", "decision-log"),
          ],
          ctaTitle: "Treat the handoff as an operating step, not a vague status change.",
          ctaDescription:
            "When design and engineering share one workflow transition with linked decisions and docs, implementation starts faster and with less rework.",
        },
      ),
      "use-cases/async-release-planning": createPage(
        "use-cases",
        "async-release-planning",
        {
          seo: {
            title: "Async Release Planning Workflow for Remote Teams",
            description:
              "Plan releases asynchronously with visible blockers, linked checklists, pending confirmations, and digest-ready updates in one shared workflow.",
            keywords: [
              "async release planning",
              "release planning workflow",
              "remote release coordination",
              "release checklist workflow",
              "async launch planning",
            ],
            breadcrumbLabel: "Async Release Planning",
          },
          eyebrow: "Use case / Async release planning",
          title: "Plan releases asynchronously without losing risk visibility.",
          summary:
            "Release work often spans product, design, engineering, operations, and support. Synaply should help teams coordinate that movement through visible blockers, confirmation states, and shared release context instead of repeated alignment calls.",
          cardDescription:
            "An async release coordination pattern built around blockers, checklists, and pending confirmations.",
          highlights: [
            "Release status that stays visible across roles",
            "Pending confirmations tied to actual work objects",
            "Digest-friendly updates for launch readiness",
          ],
          sections: [
            createSection(
              "What release planning needs beyond a date",
              "A release does not move because a calendar says it should.",
              "It moves when dependencies are visible, owners are clear, and the team can see what still needs confirmation before launch. That context belongs in the same operating view as the work itself.",
              [
                "Track readiness by item state, not by optimistic comments.",
                "Separate blocked, pending, and ready work in the workflow.",
                "Keep the release checklist and decision changes attached to the same surface.",
              ],
            ),
            createSection(
              "Why async planning works when the structure is strong",
              "The problem with async release planning is rarely async itself. It is weak structure.",
              "When roles can self-serve the current state, see blockers, and understand the next checkpoint, fewer meetings are needed to keep launch work aligned.",
              [
                "Use one shared checklist instead of multiple parallel notes.",
                "Publish concise digest updates from workflow movement.",
                "Escalate only the confirmations that actually need synchronous discussion.",
              ],
            ),
            createSection(
              "How Synaply should support release coordination",
              "The product should make release readiness feel legible, not overwhelming.",
              "That means tying issue movement, blocker status, decision logs, and doc context into one release story that stakeholders can scan quickly.",
              [
                "Keep launch-related issues visible as a grouped operating view.",
                "Tie decisions and risk notes to the release plan instead of a separate archive.",
                "Use digest patterns to share launch status without rewriting everything manually.",
              ],
            ),
          ],
          checklistTitle: "Use this page when your team needs to:",
          checklist: [
            "coordinate launch work across multiple roles without more recurring meetings",
            "track release readiness through blockers and pending confirmations",
            "keep the checklist, decision notes, and actual work visible together",
            "publish calmer async release updates to stakeholders",
          ],
          relatedPaths: [
            getMarketingDetailPath("templates", "release-checklist"),
            getMarketingDetailPath("features", "async-digest"),
            getMarketingDetailPath("features", "blocker-tracking"),
          ],
          ctaTitle: "Make release planning a visible workflow, not a status chase.",
          ctaDescription:
            "The more clearly your team can see blockers, confirmations, and readiness, the less launch coordination depends on live meetings.",
        },
      ),
      "templates/product-brief": createPage("templates", "product-brief", {
        seo: {
          title: "Product Brief Template for Remote Product Teams",
          description:
            "Use this product brief template structure to define scope, problem, constraints, stakeholders, and next actions for remote cross-functional execution.",
          keywords: [
            "product brief template",
            "remote product brief",
            "project brief template",
            "cross functional brief template",
            "product planning template",
          ],
          breadcrumbLabel: "Product Brief Template",
        },
        eyebrow: "Template / Product brief",
        title: "A product brief template should align the team before work fragments.",
        summary:
          "A strong product brief gives product, design, engineering, and operations one shared starting point. It does not need to be long. It needs to define the problem, scope, tradeoffs, and what happens next.",
        cardDescription:
          "A concise brief structure for scope, stakeholders, constraints, and next execution steps.",
        highlights: [
          "Clear problem framing before work branches into multiple roles",
          "Enough scope and context to reduce follow-up questions",
          "A direct bridge from brief to issues and workflow stages",
        ],
        sections: [
          createSection(
            "What a brief should contain",
            "A useful brief is structured, not bloated.",
            "Teams need enough information to align on the problem, target outcome, constraints, stakeholders, and delivery context. Everything else should support that core operating clarity.",
            [
              "Define the user or business problem in plain language.",
              "State the intended outcome and what success looks like.",
              "Record constraints, assumptions, stakeholders, and non-goals.",
            ],
          ),
          createSection(
            "How the brief should connect to execution",
            "A brief is only useful if it leads naturally into action.",
            "That means the brief should map to projects, issues, design review, and workflow movement instead of becoming a static planning document that nobody checks again.",
            [
              "Break the brief into actionable issues or milestones.",
              "Link decisions or open questions directly from the brief.",
              "Use the brief as a stable anchor during cross-role handoffs.",
            ],
          ),
          createSection(
            "How Synaply should use this pattern",
            "The brief should live close to the work it creates.",
            "Synaply should make it easy to keep the originating brief, the current workflow state, and the downstream tasks inside one connected operating chain.",
            [
              "Attach the brief to the project instead of a disconnected docs archive.",
              "Reference the brief from execution items when tradeoffs are revisited.",
              "Use the same context again when preparing digest updates or release decisions.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "create project scope that multiple roles can act on",
          "reduce re-explaining the same background during planning and handoff",
          "tie strategy and execution together more closely",
          "build a better starting point for remote product work",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "remote-product-teams"),
          getMarketingDetailPath("templates", "decision-log"),
          getMarketingDetailPath("features", "handoffs"),
        ],
        ctaTitle: "Use the brief as the first link in the execution chain.",
        ctaDescription:
          "When the brief stays connected to the project and issues it creates, the team can move faster with fewer restarts and less repeated background explanation.",
      }),
      "templates/design-review": createPage("templates", "design-review", {
        seo: {
          title: "Design Review Template for Product and Engineering Handoff",
          description:
            "Use a design review template that captures intent, open questions, approvals, and handoff readiness before work moves into engineering.",
          keywords: [
            "design review template",
            "design handoff template",
            "product design review",
            "design to engineering review",
            "remote design review workflow",
          ],
          breadcrumbLabel: "Design Review Template",
        },
        eyebrow: "Template / Design review",
        title: "A design review template should clarify decisions before engineering takeover.",
        summary:
          "Good design reviews do not only collect comments. They make approval state, open questions, tradeoffs, and handoff readiness obvious so the next role can move confidently.",
        cardDescription:
          "A review structure for approvals, open questions, tradeoffs, and engineering-ready handoff context.",
        highlights: [
          "Review outcomes that are clearer than comment piles",
          "Approval and open-question states that support handoff",
          "A stronger bridge from design intent to implementation work",
        ],
        sections: [
          createSection(
            "What the review should answer",
            "A design review exists to reduce ambiguity before work advances.",
            "That means the template should surface whether the design is approved, what still needs input, what tradeoffs were accepted, and what engineering should treat as fixed versus flexible.",
            [
              "Record the decision outcome, not just the discussion.",
              "Capture unresolved questions with owners and follow-up paths.",
              "Clarify where fidelity matters and where implementation can adapt.",
            ],
          ),
          createSection(
            "How to connect review to handoff",
            "A strong review leaves behind a transfer-ready summary.",
            "Instead of asking engineering to infer the latest answer from comments, the review should produce a concise handoff package with the key acceptance context already organized.",
            [
              "Link the review outcome to the issue or project it affects.",
              "Summarize scope changes or priority shifts clearly.",
              "Attach any decision log entries created during the review.",
            ],
          ),
          createSection(
            "How Synaply should reinforce the pattern",
            "The review template becomes more valuable when it stays connected to execution.",
            "Synaply should let the review sit near the workflow state, linked docs, and takeover owner so the transition into engineering feels like a continuation, not a restart.",
            [
              "Preserve review notes near the workflow item itself.",
              "Use the review summary again inside digest or release communication.",
              "Keep the handoff visible until implementation is truly underway.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "standardize design review across product, design, and engineering",
          "capture approval state before engineering starts work",
          "package open questions and tradeoffs into a better handoff",
          "reduce “what changed after review?” confusion",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "design-engineering-handoff"),
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("features", "handoffs"),
        ],
        ctaTitle: "Use review output to strengthen the next handoff.",
        ctaDescription:
          "A design review becomes far more useful when its result directly prepares the next owner to act instead of leaving them to reconstruct the context.",
      }),
      "templates/release-checklist": createPage(
        "templates",
        "release-checklist",
        {
          seo: {
            title: "Release Checklist Template for Async Launch Planning",
            description:
              "Use a release checklist template that tracks readiness, dependencies, pending confirmations, and ownership for async launch planning.",
            keywords: [
              "release checklist template",
              "launch checklist template",
              "async release planning template",
              "release readiness checklist",
              "remote launch checklist",
            ],
            breadcrumbLabel: "Release Checklist Template",
          },
          eyebrow: "Template / Release checklist",
          title: "A release checklist template should make readiness and risk visible together.",
          summary:
            "The goal of a release checklist is not to create more boxes. It is to make launch dependencies, approval state, and remaining risk visible enough that teams can move confidently without constant sync meetings.",
          cardDescription:
            "A launch checklist structure for readiness, blockers, confirmations, and cross-role ownership.",
          highlights: [
            "Readiness signals that reflect actual execution state",
            "Ownership per checklist area, not vague group responsibility",
            "A stronger bridge between checklist status and launch updates",
          ],
          sections: [
            createSection(
              "What a good release checklist contains",
              "A useful checklist combines verification, dependency, and communication work.",
              "It should cover the concrete items that determine launch readiness, but also make clear which role owns each area and what still needs confirmation.",
              [
                "Track product, engineering, operations, and communication readiness separately.",
                "Mark blocked items clearly rather than hiding them inside notes.",
                "Show which confirmations are pending and who must provide them.",
              ],
            ),
            createSection(
              "How to keep the checklist honest",
              "The checklist should mirror the real state of the launch, not just optimism.",
              "That means linking it to the issues, blockers, and decisions that drive readiness rather than maintaining a static list disconnected from actual work.",
              [
                "Connect checklist items to the work objects that prove readiness.",
                "Use status labels that distinguish ready, pending, and blocked.",
                "Update the checklist through workflow movement, not only manual edits.",
              ],
            ),
            createSection(
              "How Synaply should support this template",
              "The release checklist belongs beside the release workflow, not outside it.",
              "Synaply should help teams keep launch context, blockers, decisions, and digest-ready summaries within one operating view so stakeholders can self-serve the current picture.",
              [
                "Link the checklist to the release project or workflow board.",
                "Use digest summaries to report launch readiness asynchronously.",
                "Preserve the checklist as a reusable operating pattern after launch.",
              ],
            ),
          ],
          checklistTitle: "Use this page when your team needs to:",
          checklist: [
            "turn launch readiness into something visible and discussable",
            "coordinate product, engineering, ops, and communication work asynchronously",
            "separate blocked checklist items from ready ones clearly",
            "publish calmer release updates with less manual rewriting",
          ],
          relatedPaths: [
            getMarketingDetailPath("use-cases", "async-release-planning"),
            getMarketingDetailPath("features", "async-digest"),
            getMarketingDetailPath("features", "blocker-tracking"),
          ],
          ctaTitle: "Use the checklist to expose readiness, not to create ceremony.",
          ctaDescription:
            "When a release checklist is tied to real workflow movement, it becomes a reliable operating tool instead of one more static launch document.",
        },
      ),
      "templates/decision-log": createPage("templates", "decision-log", {
        seo: {
          title: "Decision Log Template for Product and Engineering Teams",
          description:
            "Use a decision log template to capture the decision, rationale, owner, and affected work so remote teams keep context attached to execution.",
          keywords: [
            "decision log template",
            "decision record template",
            "product decision template",
            "engineering decision log template",
            "remote team decision log",
          ],
          breadcrumbLabel: "Decision Log Template",
        },
        eyebrow: "Template / Decision log",
        title: "A decision log template should make rationale reusable across handoffs.",
        summary:
          "The best decision logs are compact and specific. They let a teammate understand what changed, why it changed, and what project or issue it affects without reading an entire thread history.",
        cardDescription:
          "A reusable format for decision summary, rationale, owner, and impacted work.",
        highlights: [
          "One clear decision statement per entry",
          "Enough rationale to stop repeat debates",
          "Direct linkage to affected projects, issues, or docs",
        ],
        sections: [
          createSection(
            "What the template should ask for",
            "A decision log entry should force clarity, not invite vague notes.",
            "Teams should record the decision summary, rationale, owner, date, impact area, and any required follow-up so the entry is immediately useful later.",
            [
              "Write the decision as a plain-language conclusion.",
              "Record the tradeoff or rationale that made the choice sensible.",
              "Link the items, docs, or releases influenced by the decision.",
            ],
          ),
          createSection(
            "How the template supports cross-role work",
            "The template is most valuable when work changes hands.",
            "Product, design, engineering, and ops can all move faster when the current rationale is visible beside the work instead of hidden in a meeting summary or old comment chain.",
            [
              "Use the same decision format across planning, review, and release work.",
              "Attach the entry wherever ownership or scope shifts.",
              "Use linked decision entries to explain why a workflow state changed.",
            ],
          ),
          createSection(
            "How Synaply should reinforce the pattern",
            "The template should sit inside the shared collaboration flow, not beside it.",
            "Synaply should make it easy to create a decision record from active execution and revisit it during later handoffs, blocker reviews, and digest preparation.",
            [
              "Create decision entries close to the issue or project they affect.",
              "Reference them from review docs and release plans as needed.",
              "Keep the latest valid decision easy to find without hiding the history.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "capture rationale in a format the next owner can actually use",
          "keep scope and policy changes attached to execution items",
          "reduce repeated debate across planning, review, and release work",
          "create a reusable operating standard for decisions",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("templates", "product-brief"),
          getMarketingDetailPath("features", "handoffs"),
        ],
        ctaTitle: "Use one decision format across the whole execution chain.",
        ctaDescription:
          "When decisions are easy to create, easy to link, and easy to revisit, they stop being lost context and start becoming durable operating memory.",
      }),
      "integrations/github": createPage("integrations", "github", {
        seo: {
          title: "GitHub Collaboration Bridge for Remote Product Teams",
          description:
            "Use Synaply as the coordination layer around GitHub execution so issue context, review notes, blockers, and delivery updates stay visible across roles.",
          keywords: [
            "GitHub collaboration bridge",
            "GitHub workflow coordination",
            "GitHub handoff workflow",
            "GitHub release coordination",
            "engineering execution visibility",
          ],
          breadcrumbLabel: "GitHub",
        },
        eyebrow: "Integration / GitHub",
        title: "GitHub should stay the code execution source while Synaply holds the cross-role context.",
        summary:
          "Engineering work often lives in GitHub, but the broader coordination around it does not fit there cleanly. Synaply is best positioned as the workflow and context layer around that execution, especially for product, design, and ops stakeholders.",
        cardDescription:
          "Position Synaply around GitHub work so execution context remains visible to the whole team.",
        highlights: [
          "GitHub for code, Synaply for cross-role coordination",
          "Better visibility around review, blockers, and release movement",
          "A calmer surface for non-engineering stakeholders",
        ],
        sections: [
          createSection(
            "What GitHub is excellent at",
            "GitHub is the right place for code review and engineering execution.",
            "The problem is not GitHub itself. It is that release context, cross-role handoffs, and decision tracking often need a broader operating surface than a code host naturally provides.",
            [
              "Use GitHub to manage code, pull requests, and engineering review.",
              "Do not try to replace engineering execution with a generic PM layer.",
              "Keep Synaply focused on coordination that spans beyond code review.",
            ],
          ),
          createSection(
            "Where Synaply adds value around GitHub work",
            "The team still needs to see what the code work means for the release, the workflow, and the broader project.",
            "Synaply should help product, design, engineering, and operations understand the state of the work without forcing every stakeholder into engineering-native tools all day.",
            [
              "Tie GitHub-facing work back to projects, blockers, and decisions.",
              "Make handoff and release status visible to non-engineering roles.",
              "Use async digest patterns to summarize movement around the code work.",
            ],
          ),
          createSection(
            "What the integration boundary should be",
            "The bridge should stay lightweight and deliberate.",
            "The goal is not to mirror every commit or become another GitHub dashboard. The goal is to make the execution context legible where cross-functional coordination actually happens.",
            [
              "Prioritize issue, handoff, and release-level visibility over noisy event sync.",
              "Keep the bridge focused on signals that change decisions or ownership.",
              "Treat GitHub as a source of execution truth, not the only place the team can understand progress.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "connect engineering execution to a broader cross-functional workflow",
          "give non-engineering roles visibility into GitHub-shaped work without constant recaps",
          "keep release and blocker context closer to the code work that drives it",
          "avoid turning Synaply into a duplicate engineering dashboard",
        ],
        relatedPaths: [
          getMarketingDetailPath("integrations", "slack"),
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
        ],
        ctaTitle: "Use GitHub and Synaply together without duplicating their jobs.",
        ctaDescription:
          "The cleanest setup keeps code execution where engineers want it, while giving the rest of the team a clearer coordination layer around the work.",
      }),
      "integrations/slack": createPage("integrations", "slack", {
        seo: {
          title: "Slack Bridge for Async Team Coordination",
          description:
            "Use Synaply as the system of record and Slack as the signal layer so blockers, handoffs, and async updates stay structured instead of disappearing into chat history.",
          keywords: [
            "Slack async updates",
            "Slack collaboration bridge",
            "Slack status coordination",
            "system of record vs chat",
            "remote team async workflow",
          ],
          breadcrumbLabel: "Slack",
        },
        eyebrow: "Integration / Slack",
        title: "Slack should deliver signals, not become the system of record.",
        summary:
          "Remote teams need Slack for fast coordination, but chat is a poor place to preserve blockers, decisions, and handoff state over time. Synaply should keep the structured context while Slack distributes the right signals.",
        cardDescription:
          "Use Slack for alerts and movement signals while Synaply keeps the durable execution context.",
        highlights: [
          "Slack for alerts, Synaply for durable context",
          "Less status loss inside fast-moving channels",
          "A cleaner async rhythm across the team",
        ],
        sections: [
          createSection(
            "What chat is good at",
            "Slack is useful for quick coordination and attention routing.",
            "It is not the best place to store project rationale, blocker ownership, or release readiness over time. Fast chat excels at awareness, not durable execution memory.",
            [
              "Use Slack to nudge attention when something changed.",
              "Keep structured state in Synaply instead of a message thread.",
              "Avoid relying on channel memory for decisions or workflow ownership.",
            ],
          ),
          createSection(
            "Where the bridge adds value",
            "The right bridge reduces manual reposting without duplicating the product.",
            "Synaply should send the moments that matter into Slack while keeping the deeper context anchored where work, docs, and transitions already live together.",
            [
              "Notify the team when blockers, handoffs, or approvals change.",
              "Link back to the execution object instead of copying the whole context into chat.",
              "Use digest-style summaries to batch information for calmer async follow-up.",
            ],
          ),
          createSection(
            "What to avoid",
            "The bridge should not make Slack even noisier.",
            "The best Slack integration is selective. It forwards meaningful movement, preserves context elsewhere, and makes it easy for the team to step into the right object only when needed.",
            [
              "Do not push every low-signal change into chat.",
              "Keep notifications tied to ownership, blockers, approvals, and release movement.",
              "Make the linked destination clearer than the message itself.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "stop losing blockers and decisions inside chat history",
          "send the right workflow signals into Slack without flooding channels",
          "tie chat notifications back to a clearer system of record",
          "improve async awareness without creating more noise",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "async-digest"),
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("integrations", "github"),
        ],
        ctaTitle: "Let Slack distribute attention while Synaply preserves clarity.",
        ctaDescription:
          "A good bridge helps the team notice what changed, then move into the right context only when action is needed.",
      }),
      "compare/linear-alternative": createPage("compare", "linear-alternative", {
        seo: {
          title: "Linear Alternative for Remote Cross-Functional Product Teams",
          description:
            "Compare Synaply vs Linear if your team needs more explicit handoffs, docs connected to execution, blocker visibility, and calmer async coordination across roles.",
          keywords: [
            "Linear alternative",
            "Linear alternative for remote teams",
            "Linear vs Synaply",
            "cross functional execution tool",
            "handoff focused project software",
          ],
          breadcrumbLabel: "Linear Alternative",
        },
        eyebrow: "Compare / Linear alternative",
        title: "Choose Synaply over Linear when cross-role execution needs more context than issue tracking alone.",
        summary:
          "Linear is strong for fast engineering-flavored issue management. Synaply is a better fit when product, design, engineering, and ops need projects, workflows, docs, blockers, and async updates to live in one calmer collaboration tool.",
        cardDescription:
          "A positioning page for teams that need more cross-role context and handoff support than issue tracking alone.",
        highlights: [
          "Better fit for product, design, engineering, and ops in one flow",
          "Stronger emphasis on docs, handoffs, and blocker visibility",
          "A more explicit remote collaboration software posture",
        ],
        sections: [
          createSection(
            "Where Linear is strong",
            "Linear excels at speed, issue flow, and a clean engineering-adjacent interface.",
            "Teams with an engineering-heavy execution style may prefer that focus. But when broader cross-role collaboration becomes the bottleneck, issue flow alone may stop being enough.",
            [
              "Fast issue movement and engineering-friendly workflows.",
              "Strong fit for teams centered primarily on issue execution.",
              "Less emphasis on docs, rationale, and multi-role handoff context as a unified system.",
            ],
          ),
          createSection(
            "Where Synaply is meaningfully different",
            "Synaply is positioned around structured remote collaboration, not just issue throughput.",
            "It is built to connect projects, issues, workflows, docs, and digest surfaces so the whole team can move work forward with less chasing and fewer context resets.",
            [
              "More explicit support for handoffs between product, design, engineering, and ops.",
              "Stronger emphasis on docs and decision context inside execution.",
              "Better alignment with blocker visibility and async rhythm needs.",
            ],
          ),
          createSection(
            "Who should consider switching",
            "The best fit is a small cross-functional team, not a giant enterprise org.",
            "If your team keeps losing time around review, blockers, rationale, and release coordination, Synaply may be the more coherent operating model even if Linear remains excellent at issue flow itself.",
            [
              "Great fit for 3-15 person remote product teams.",
              "Useful when handoff clarity matters more than maximum issue velocity.",
              "Not meant for teams seeking the broadest generic PM suite possible.",
            ],
          ),
        ],
        checklistTitle: "Use this page when your team needs to:",
        checklist: [
          "compare issue-led execution with a more cross-functional collaboration tool",
          "evaluate whether docs and handoff context should sit closer to the workflow",
          "decide if blocker visibility and async coordination matter more than raw issue speed",
          "find a tool better suited to a small remote product team",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "remote-product-teams"),
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("templates", "product-brief"),
        ],
        ctaTitle: "Choose the system that matches your team’s coordination shape.",
        ctaDescription:
          "If the friction in your team comes from cross-role movement rather than lack of tickets, compare tools through the lens of handoffs, blockers, and docs in execution.",
      }),
      "compare/notion-vs-synaply-for-execution": createPage(
        "compare",
        "notion-vs-synaply-for-execution",
        {
          seo: {
            title: "Notion vs Synaply for Execution and Cross-Role Handoffs",
            description:
              "Compare Notion vs Synaply for remote execution, visible handoffs, blocker tracking, workflow clarity, and docs that stay attached to active delivery work.",
            keywords: [
              "Notion vs Synaply",
              "Notion for execution",
              "workflow alternative to Notion",
              "handoff software vs docs tool",
              "docs and execution comparison",
            ],
            breadcrumbLabel: "Notion vs Synaply",
          },
          eyebrow: "Compare / Notion vs Synaply",
          title: "Use Synaply when execution needs stronger workflow structure than a docs-first system can provide.",
          summary:
            "Notion is powerful for documentation and flexible knowledge organization. Synaply is better suited when the team’s main challenge is moving work through explicit handoffs, blockers, and workflow states without separating docs from execution.",
          cardDescription:
            "A comparison for teams deciding between flexible documentation and a more structured execution system.",
          highlights: [
            "Notion shines for flexible docs and knowledge",
            "Synaply is shaped for structured execution and handoff flow",
            "Best fit depends on whether coordination or documentation is the primary bottleneck",
          ],
          sections: [
            createSection(
              "Where Notion is strongest",
              "Notion is excellent when flexibility is the main requirement.",
              "Teams that need open-ended documentation, wikis, and lightweight organization often move quickly in Notion. But that flexibility can make operating state less legible when work spans several roles.",
              [
                "Strong for docs, notes, and flexible knowledge structure.",
                "Useful when the team can tolerate looser workflow conventions.",
                "Less opinionated around blockers, handoffs, and ownership transitions.",
              ],
            ),
            createSection(
              "Where Synaply becomes the better fit",
              "Synaply is more opinionated about how work should move.",
              "That is helpful when product, design, engineering, and ops need a workflow that shows real stage movement, blocker state, and next ownership while still keeping docs attached to the work.",
              [
                "Projects, issues, workflows, and docs are intentionally connected.",
                "Handoffs and blockers are treated as first-class execution events.",
                "Async digests and release coordination fit the same operating chain.",
              ],
            ),
            createSection(
              "How to decide between them",
              "Choose based on your primary pain point.",
              "If the team mostly struggles with knowledge organization, Notion may be enough. If the team struggles with moving work through a multi-role workflow reliably, Synaply is the more targeted system.",
              [
                "Pick Notion when flexible docs are the center of gravity.",
                "Pick Synaply when execution clarity and handoff flow matter more.",
                "Use the comparison to sharpen your workflow needs before choosing a tool.",
              ],
            ),
          ],
          checklistTitle: "Use this page when your team needs to:",
          checklist: [
            "compare a docs-first workspace with a more execution-focused collaboration tool",
            "decide whether workflow clarity is now a bigger bottleneck than note-taking flexibility",
            "evaluate how handoffs and blockers should live next to docs",
            "choose a calmer system for small remote cross-functional teams",
          ],
          relatedPaths: [
            getMarketingDetailPath("features", "decision-log"),
            getMarketingDetailPath("features", "workflow-visibility"),
            getMarketingDetailPath("use-cases", "remote-product-teams"),
          ],
          ctaTitle: "Decide whether your real bottleneck is knowledge or execution flow.",
          ctaDescription:
            "That answer usually makes the tooling choice clearer. Synaply is strongest when work movement, handoffs, and shared operating context matter most.",
        },
      ),
    },
  },
  zh: {
    shared: {
      homeLabel: "首页",
      overviewLabel: "执行专题",
      highlightsLabel: "这页主要解决的问题",
      previewEyebrow: "产品界面",
      previewTitle: "把 workflow、docs 和 owner 放进同一个可见的协作空间里。",
      previewDescription:
        "这些页面不应该只是 SEO 壳子，而应该回到真实产品界面。Synaply 把 projects、issues、workflows 和 docs 收在一起，让 handoff 不再依赖口头同步。",
      checklistEyebrow: "适用场景",
      relatedEyebrow: "相关下一步",
      relatedTitle: "围绕同一个协作问题，继续走通站内链接链路。",
      ctaEyebrow: "把追状态，换成看得见的执行",
      primaryCtaLabel: "进入工作空间",
      secondaryCtaLabel: "查看工作流",
      authCtaLabel: "开始使用 Synaply",
      pricingCtaLabel: "查看定价",
      landingCtaLabel: "回到首页",
      footerDescription: "为远程产品、设计、工程和运营团队打造的更克制、更清晰的小而美协作软件。",
      footerSections: [
        {
          title: "总览",
          items: [
            { label: "首页", href: MARKETING_PAGE_PATHS.landing },
            { label: "定价", href: MARKETING_PAGE_PATHS.pricing },
            { label: "关于", href: MARKETING_PAGE_PATHS.about },
          ],
        },
        {
          title: "SEO 目录",
          items: [
            { label: "功能页", href: MARKETING_CATEGORY_PATHS.features },
            { label: "场景页", href: MARKETING_CATEGORY_PATHS["use-cases"] },
            { label: "模板页", href: MARKETING_CATEGORY_PATHS.templates },
            { label: "集成页", href: MARKETING_CATEGORY_PATHS.integrations },
          ],
        },
        {
          title: "高意图入口",
          items: [
            {
              label: "Linear 替代方案",
              href: getMarketingDetailPath("compare", "linear-alternative"),
            },
            {
              label: "Notion vs Synaply",
              href: getMarketingDetailPath(
                "compare",
                "notion-vs-synaply-for-execution",
              ),
            },
            {
              label: "设计评审模板",
              href: getMarketingDetailPath("templates", "design-review"),
            },
          ],
        },
      ],
      coreLinks: {
        [MARKETING_PAGE_PATHS.landing]: createCard(
          "远程协作软件",
          "查看 Synaply 的核心定位，以及 projects、issues、workflows、docs 如何连成一条执行链。",
          MARKETING_PAGE_PATHS.landing,
        ),
        [MARKETING_PAGE_PATHS.pricing]: createCard(
          "适合专注型远程团队的定价",
          "查看面向小型跨职能团队的价格包装，以及为什么它围绕更清晰的 handoff 和 execution 来设计。",
          MARKETING_PAGE_PATHS.pricing,
        ),
        [MARKETING_PAGE_PATHS.about]: createCard(
          "为什么 Synaply 会存在",
          "理解 Synaply 对 structured execution、visible handoff 和 docs 紧贴交付的产品哲学。",
          MARKETING_PAGE_PATHS.about,
        ),
      },
    },
    hubs: {
      features: createHub("features", {
        seo: {
          title: "跨角色 Handoff、Blocker 管理与 Decision Log 功能",
          description:
            "查看 Synaply 如何处理 handoff、blocker tracking、decision log、async digest 与 workflow visibility，帮助远程团队减少追问与状态丢失。",
          keywords: [
            "handoff 管理",
            "blocker 管理",
            "decision log",
            "async digest",
            "workflow visibility",
          ],
          breadcrumbLabel: "功能页",
        },
        eyebrow: "功能目录",
        title: "先把最容易造成追状态的执行节点做清楚。",
        description:
          "这一组页面解释 Synaply 如何把 handoff、blocker、decision 和 async update 变成可见的 operating flow，而不是散落在 chat、doc 和记忆里的碎片。",
        highlights: [
          "handoff 时明确 owner 和 next action",
          "把 blocker 变成可见的执行状态",
          "让 docs 和 decision 紧贴 workflow",
        ],
        stats: [
          { value: "5", label: "个优先功能主题" },
          { value: "3-15", label: "人理想团队规模" },
          { value: "1", label: "个共享执行界面" },
        ],
        featuredPaths: [
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("features", "blocker-tracking"),
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("features", "async-digest"),
          getMarketingDetailPath("features", "workflow-visibility"),
        ],
        ctaTitle: "先做最能减少 chasing 的功能，而不是先扩表面模块。",
        ctaDescription:
          "最有价值的功能，往往不是“更多”，而是让 handoff、blocker 和 visibility 变得足够清楚，让团队少追问、少补解释。",
      }),
      "use-cases": createHub("use-cases", {
        seo: {
          title: "远程产品团队、设计交接与异步发布推进场景",
          description:
            "查看 Synaply 在远程产品团队、设计到工程交接、异步发布推进等场景下如何把项目、workflow、docs 与 blocker 串成一条执行链。",
          keywords: [
            "远程产品团队协作",
            "设计交接流程",
            "异步发布推进",
            "跨职能团队协作",
            "远程协作软件",
          ],
          breadcrumbLabel: "场景页",
        },
        eyebrow: "场景目录",
        title: "围绕真实协作场景，而不是泛功能介绍来建页面。",
        description:
          "这一组页面聚焦远程团队最容易失速的几个 moment：设计交接、跨角色对齐、异步发布推进。每页都应该回答谁在配合、哪里会卡、怎么继续走下去。",
        highlights: [
          "远程产品团队协同",
          "设计到工程交接",
          "异步发布与确认流",
        ],
        stats: [
          { value: "3", label: "个高价值场景入口" },
          { value: "4", label: "类核心角色" },
          { value: "0", label: "个额外状态会也能推进" },
        ],
        featuredPaths: [
          getMarketingDetailPath("use-cases", "remote-product-teams"),
          getMarketingDetailPath("use-cases", "design-engineering-handoff"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
        ],
        ctaTitle: "先让页面回答真实团队场景，再谈关键词覆盖。",
        ctaDescription:
          "场景页不是换个标题的功能页，而是完整解释一条协作链：谁参与、哪里容易掉、Synaply 具体怎么降低摩擦。",
      }),
      templates: createHub("templates", {
        seo: {
          title: "Product Brief、Design Review 与 Release Checklist 模板",
          description:
            "围绕产品 brief、设计评审、发布 checklist 与 decision log，建立适合远程团队的模板型 SEO 页面和执行结构。",
          keywords: [
            "product brief 模板",
            "design review 模板",
            "release checklist 模板",
            "decision log 模板",
            "远程团队模板",
          ],
          breadcrumbLabel: "模板页",
        },
        eyebrow: "模板目录",
        title: "模板的价值，不是统一格式，而是减少每次重新发明流程。",
        description:
          "Synaply 需要的不是堆模板数量，而是先把最常复用的协作结构做扎实：brief、review、checklist、decision。这样团队才能形成稳定 operating habit。",
        highlights: [
          "复用型协作结构",
          "模板与 projects / issues / docs 串联",
          "从模板直接走向执行",
        ],
        stats: [
          { value: "4", label: "个优先模板页面" },
          { value: "1", label: "条要映射的执行链" },
          { value: "100%", label: "按异步协作设计" },
        ],
        featuredPaths: [
          getMarketingDetailPath("templates", "product-brief"),
          getMarketingDetailPath("templates", "design-review"),
          getMarketingDetailPath("templates", "release-checklist"),
          getMarketingDetailPath("templates", "decision-log"),
        ],
        ctaTitle: "先把最常复用的模板页做深，而不是先开大而全内容库。",
        ctaDescription:
          "模板真正有价值，是因为它能缩短从 context 到 next action 的路径。先把 brief、review、release、decision 做扎实，再扩展。",
      }),
      integrations: createHub("integrations", {
        seo: {
          title: "GitHub 与 Slack 轻量协作集成策略",
          description:
            "理解 Synaply 如何围绕 GitHub 和 Slack 建立轻量 bridge，让工程执行与异步协作信号更清楚，而不是把产品做成聊天或代码托管工具。",
          keywords: [
            "GitHub 集成",
            "Slack 集成",
            "轻量协作集成",
            "GitHub bridge",
            "Slack bridge",
          ],
          breadcrumbLabel: "集成页",
        },
        eyebrow: "集成目录",
        title: "集成应该服务 workflow，而不是把产品带偏。",
        description:
          "Synaply 不应该变成 chat 工具，也不应该复制 GitHub。最合适的做法，是让 GitHub 保持代码执行源，让 Slack 负责信号分发，而 Synaply 保留结构化协作上下文。",
        highlights: [
          "GitHub 保持工程执行中心",
          "Slack 保持通知与协同信号层",
          "Synaply 负责跨角色上下文",
        ],
        stats: [
          { value: "2", label: "个优先 bridge 页面" },
          { value: "1", label: "层共享协作上下文" },
          { value: "更少", label: "复制粘贴式状态同步" },
        ],
        featuredPaths: [
          getMarketingDetailPath("integrations", "github"),
          getMarketingDetailPath("integrations", "slack"),
        ],
        ctaTitle: "让集成保持轻量，才能不稀释产品定位。",
        ctaDescription:
          "最好的 integration 是把真正重要的 execution signal 接进来，而不是把 Synaply 做成另一个聊天列表或另一个工程面板。",
      }),
      compare: createHub("compare", {
        seo: {
          title: "Linear Alternative 与 Notion vs Synaply 对比页",
          description:
            "围绕 remote execution、visible handoff、blocker visibility 与 docs 紧贴交付的定位，建立 Synaply 的高意图 compare 页面。",
          keywords: [
            "Linear alternative",
            "Notion vs Synaply",
            "协作软件对比",
            "远程执行工具对比",
            "小团队协作替代方案",
          ],
          breadcrumbLabel: "对比页",
        },
        eyebrow: "对比目录",
        title: "对比页的目标不是贬低别人，而是把 Synaply 的边界讲清楚。",
        description:
          "这组页面服务的是已经知道问题、正在比较方案的用户。重点不是“功能更多”，而是明确说明 Synaply 为什么更适合小型远程跨职能团队的 structured execution。",
        highlights: [
          "更强商业意图",
          "更需要清晰定位差异",
          "更适合承接高价值查询词",
        ],
        stats: [
          { value: "2", label: "个优先 compare 页面" },
          { value: "高", label: "商业搜索意图" },
          { value: "清晰", label: "定位差异表达要求" },
        ],
        featuredPaths: [
          getMarketingDetailPath("compare", "linear-alternative"),
          getMarketingDetailPath("compare", "notion-vs-synaply-for-execution"),
        ],
        ctaTitle: "让 compare 页面强化产品边界，而不是拉宽产品边界。",
        ctaDescription:
          "好的 compare 页面会让 Synaply 看起来更聚焦、更有判断，而不是变成“什么都能做”的泛工具。",
      }),
    },
    pages: {
      "features/handoffs": createPage("features", "handoffs", {
        seo: {
          title: "适合产品、设计、工程团队的 Handoff 协作方式",
          description:
            "用 Synaply 把 design review、engineering takeover 和 operations follow-up 变成可见 handoff：owner 明确、doc 挂靠、next action 清楚。",
          keywords: [
            "handoff 协作",
            "设计到工程交接",
            "跨角色交接",
            "远程团队 handoff",
            "协作交接流程",
          ],
          breadcrumbLabel: "Handoff",
        },
        eyebrow: "功能 / Handoff",
        title: "别让工作一换 owner，就掉进角色之间的缝里。",
        summary:
          "Synaply 适合那些需要 request review、把工作正式交给下一个 owner、并且在 transition 之后依然保持 next step 可见的远程团队。",
        cardDescription:
          "把 owner、linked doc 和 next action 绑在一次真实交接上，而不是靠口头同步。",
        highlights: [
          "review 结果和交接动作放在一起",
          "next owner 和 next action 明确可见",
          "doc 与 decision 跟着交接一起走",
        ],
        sections: [
          createSection(
            "交接前",
            "给下一个角色足够的上下文，让它能立刻推进。",
            "真正有效的 handoff 不是改一下状态，而是把目标、当前状态、未决问题和需要挂靠的 doc 一次性准备好，让接手方不用重新拼信息。",
            [
              "在 handoff 前把 requirement、review note 或 checklist 挂好。",
              "明确写出接手角色，而不是默认大家会懂。",
              "说明什么叫 ready，避免下一个 owner 继续猜。",
            ],
          ),
          createSection(
            "交接时",
            "让 transition 成为整个团队都能看到的 workflow 事件。",
            "交接如果只发生在私聊或 comment 里，最终一定会有人错过。Synaply 的价值，是把 state change、owner change 和 linked context 变成共享可见的 operating event。",
            [
              "用真实跨角色转移来定义 workflow stage。",
              "把 comments、notes 和 docs 保留在同一个执行对象附近。",
              "减少“现在到谁了”的追问。",
            ],
          ),
          createSection(
            "交接后",
            "让 follow-through 继续保持清楚，而不是交完就消失。",
            "很多团队的问题不是不会交接，而是交接之后上下文又断了。Synaply 应该让新的 owner、当前状态和下一步行动继续可见，直到进入下一个 milestone。",
            [
              "显示新的 owner 以及它的下一步动作。",
              "把 review feedback 和 follow-up decision 留在原执行对象边上。",
              "下一次 handoff 继续复用同一套上下文，而不是重新解释。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "在不拉新会议的前提下发起 product / design / engineering review",
          "把设计结果正式移交给工程，同时保留 rationale",
          "把 release follow-up 交给 ops 时不丢上下文",
          "减少“这个现在谁在接？”这类远程协作追问",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("use-cases", "design-engineering-handoff"),
          getMarketingDetailPath("templates", "design-review"),
        ],
        ctaTitle: "把下一次 handoff 放进同一个 visible workflow 里。",
        ctaDescription:
          "如果你的团队最常在 transition 上失速，就先把 owner、linked doc 和 next action 做成显式结构，而不是再加更多 follow-up。",
      }),
      "features/blocker-tracking": createPage("features", "blocker-tracking", {
        seo: {
          title: "适合远程团队的 Blocker 管理与依赖可见性",
          description:
            "在 Synaply 里显示 blocked issue、依赖来源、unblock owner 和预计恢复时间，让远程团队更早看见 delivery risk。",
          keywords: [
            "blocker 管理",
            "依赖管理",
            "远程团队阻塞",
            "delivery risk",
            "issue dependency",
          ],
          breadcrumbLabel: "Blocker 管理",
        },
        eyebrow: "功能 / Blocker 管理",
        title: "不要只写 blocked，要把它为什么卡、谁来解、何时恢复都写清楚。",
        summary:
          "Synaply 把 blocker 当作 execution 的一部分，而不是隐藏背景。一个 blocked item 应该同时说明它在等什么、谁能 unblock、以及预计何时恢复推进。",
        cardDescription:
          "让 blocked item、dependency、unblock owner 和 restart expectation 一起可见。",
        highlights: [
          "waiting state 不再隐形",
          "unblock owner 明确",
          "restart expectation 更早暴露 delivery risk",
        ],
        sections: [
          createSection(
            "一个有用的 blocker 记录应该包含什么",
            "如果系统里只有“卡住了”，那它还不够可执行。",
            "团队真正需要知道的是：在等什么依赖、谁能把它推进、以及一旦 unblock 之后应该如何恢复。否则 blocked 只是另一种模糊状态。",
            [
              "记录 blocking issue、decision、review 或缺失输入。",
              "明确写出负责解除阻塞的人或角色。",
              "给出下一次 revisit 的时间点或预期恢复时间。",
            ],
          ),
          createSection(
            "为什么 blocker 可见性会改变团队行为",
            "因为风险一旦提前变清楚，就不必等 deadline 才暴露。",
            "远程团队经常不是缺任务，而是太晚才发现哪个依赖没有动。Synaply 应该让 waiting state 和 blocked state 足够显眼，让正确的人能提前介入。",
            [
              "让 blocked item 继续出现在核心视图里，而不是消失。",
              "把 waiting 和 active progress 明确区分开。",
              "让 blocker 反映到 project 和 release 风险上。",
            ],
          ),
          createSection(
            "解除阻塞之后应该发生什么",
            "unblock 本身也是一次 workflow event。",
            "依赖一旦清除，团队需要立即看见新的 state、新 owner 和下一步动作，否则工作仍然会停在“理论上已经恢复”的阶段。",
            [
              "依赖解除后及时更新 item，而不是默认大家都会知道。",
              "保留 blocker 历史，为复盘和流程优化提供依据。",
              "观察高频 blocker 类型，反过来优化模板和流程设计。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "不用在 chat 里追问也能知道哪些工作被卡住了",
          "分清楚 delay 是因为 dependency 还是因为 owner 漂移",
          "记录谁负责解除阻塞，以及何时预计恢复推进",
          "更早看见 release 或 delivery 风险",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
          getMarketingDetailPath("templates", "release-checklist"),
        ],
        ctaTitle: "先把 waiting 变清楚，很多 delivery 风险就会提前暴露。",
        ctaDescription:
          "最有效的 blocker 优化，通常不是加更多提醒，而是把 dependency、owner 和恢复预期放进同一个可见执行界面里。",
      }),
      "features/decision-log": createPage("features", "decision-log", {
        seo: {
          title: "适合产品与工程团队的 Decision Log",
          description:
            "记录团队做了什么决定、为什么这么做、影响到哪些项目或 issue，把 rationale 留在执行对象旁边，而不是埋进旧聊天记录。",
          keywords: [
            "decision log",
            "产品决策记录",
            "工程决策记录",
            "远程团队决策",
            "决策留痕",
          ],
          breadcrumbLabel: "Decision Log",
        },
        eyebrow: "功能 / Decision Log",
        title: "别只留下结果，把 rationale 和受影响的执行对象也一起留下。",
        summary:
          "Synaply 里的 decision log 不应该只是“记录发生过什么”，而是让下一位接手的人知道为什么变、影响哪里、接下来怎么走，从而减少重复争论和重复解释。",
        cardDescription:
          "把 decision、rationale 和 affected work 连在一起，作为可复用的执行上下文。",
        highlights: [
          "记录 why，而不只是记录 what",
          "把 decision 挂到 project / issue / doc 上",
          "减少 handoff 里的重复解释",
        ],
        sections: [
          createSection(
            "一条好的 decision log 应该足够具体",
            "真正有用的决策记录，不能只写“已确认”或“已变更”。",
            "团队需要知道做了什么决定、背后权衡是什么、谁负责、影响到哪些对象。这样后面加入的人才能理解方向，而不是重新猜一遍。",
            [
              "用一句清晰的话描述结论。",
              "记录关键 tradeoff、假设和理由。",
              "把决策挂到相关 project、issue 或 doc 上。",
            ],
          ),
          createSection(
            "decision log 本质上是 handoff 基础设施",
            "跨角色协作最怕 rationale 只存在于会议和 chat 里。",
            "产品、设计、工程和运营都能更快推进，是因为它们在交接时看到的是同一份 rationale，而不是旧评论里零散的上下文。",
            [
              "让 review 和 handoff 都能引用同一条决策记录。",
              "把 state change 或 scope change 解释清楚。",
              "让下一位 owner 在接手时直接看到最新有效答案。",
            ],
          ),
          createSection(
            "decision history 应该帮助未来复盘",
            "决策记录只有在能快速回看时才有价值。",
            "团队需要知道哪些 decision 仍然有效、哪些被替代、以及它们触发了哪些 follow-up。这样复盘和 planning 才不会重新整理一遍历史。",
            [
              "明确标记 superseded 或 revisit 的决策。",
              "把后续动作与对应 decision 关联起来。",
              "用决策模式反过来优化模板和流程规则。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "避免每次 handoff 都重新解释一次 why",
          "让 scope change 挂回它真正影响的 work item",
          "把 approval 和 tradeoff 记录成可复用上下文",
          "加速新成员进入进行中的项目",
        ],
        relatedPaths: [
          getMarketingDetailPath("templates", "decision-log"),
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("use-cases", "remote-product-teams"),
        ],
        ctaTitle: "把 rationale 放在 execution 真正会用到它的地方。",
        ctaDescription:
          "如果下一位 owner 能在接手那一刻看到 decision 和 why，它就不需要再去翻老记录，也不必重新把讨论开一遍。",
      }),
      "features/async-digest": createPage("features", "async-digest", {
        seo: {
          title: "适合远程团队的 Async Digest 与周更新机制",
          description:
            "用 async digest 总结 project progress、workflow movement、open risks 和 pending confirmations，让远程团队用更少会议保持同频。",
          keywords: [
            "async digest",
            "周更新",
            "远程团队状态同步",
            "项目进展摘要",
            "异步协作更新",
          ],
          breadcrumbLabel: "Async Digest",
        },
        eyebrow: "功能 / Async Digest",
        title: "把零碎状态更新收成一个有节奏的 operating summary。",
        summary:
          "Synaply 适合把 project movement、workflow change、risk 和 pending confirmation 组织成一份 concise digest，让团队不用盯着每条消息，也能知道现在发生了什么。",
        cardDescription:
          "把 progress、risk 和 pending confirmation 打包成一个更适合远程团队的 async rhythm。",
        highlights: [
          "一个 concise update 替代多处散落同步",
          "progress、blocker 和 approval 放在同一个摘要里",
          "为远程团队建立稳定节奏",
        ],
        sections: [
          createSection(
            "一个好的 digest 应该覆盖什么",
            "不是所有变化都值得进入 digest。",
            "digest 的职责是回答：这周什么动了、什么卡住了、哪里有风险、谁还需要确认，而不是把所有 comment 再抄写一遍。",
            [
              "总结 project、workflow 和 doc 的关键变化。",
              "突出 blocker、pending confirmation 和 release risk。",
              "最后只保留真正重要的 next actions。",
            ],
          ),
          createSection(
            "为什么 digest 比通知更有效",
            "远程团队不缺 signal，缺的是更好的 batching。",
            "当重要变化被组织进一个稳定节奏里，团队成员和 stakeholder 就不必实时盯着所有 thread 才能跟上。",
            [
              "减少 chat、doc 和 issue comment 之间的重复更新。",
              "给不同角色一个可靠的 async catch-up 入口。",
              "在时区不重合时依然维持团队同频。",
            ],
          ),
          createSection(
            "怎样把 digest 建立在真实执行之上",
            "最好的 digest 不是靠记忆写出来的，而是从 execution object 生长出来。",
            "如果 project、issue、blocker 和 decision 本来就在同一个 operating context 里，digest 会更轻、更准，也更容易持续下去。",
            [
              "从 workflow movement 抽取更新，而不是手工重写全部背景。",
              "直接引用 blocker owner 和 pending confirmation。",
              "把 digest 链回真正需要动作的页面和对象。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "把 recurring status meeting 换成更好的 async 节奏",
          "跨多个角色总结本周变化，而不写成长文周报",
          "更早暴露风险和待确认事项",
          "让 stakeholder 不盯每条消息也能跟上节奏",
        ],
        relatedPaths: [
          getMarketingDetailPath("templates", "release-checklist"),
          getMarketingDetailPath("features", "blocker-tracking"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
        ],
        ctaTitle: "让 digest 生长自真实 execution，而不是额外增加写作负担。",
        ctaDescription:
          "如果你的团队已经在同一个系统里推进 project、workflow 和 blocker，那么 digest 应该是自然长出来的 operating summary，而不是另一份孤立任务。",
      }),
      "features/workflow-visibility": createPage("features", "workflow-visibility", {
        seo: {
          title: "适合跨职能团队的 Workflow Visibility",
          description:
            "让 product、design、engineering 与 ops 都能看到 stage、owner、blocked state 和 delivery risk，在远程协作里减少状态追问。",
          keywords: [
            "workflow visibility",
            "跨职能协作可见性",
            "远程团队状态透明",
            "delivery visibility",
            "workflow 状态可见性",
          ],
          breadcrumbLabel: "Workflow Visibility",
        },
        eyebrow: "功能 / Workflow Visibility",
        title: "让整个团队都看得懂 work 到了哪里，而不是等别人来复述。",
        summary:
          "当 workflow state 足够真实，团队就能快速看出谁在推进、什么在等待、哪里被卡住，以及下一步该由谁接。这比任何一次 recap meeting 更稳定。",
        cardDescription:
          "把 stage、owner、waiting state 和 risk 做成所有角色都能 self-serve 理解的界面。",
        highlights: [
          "跨角色共享状态视图",
          "减少散落在工具之间的隐形工作",
          "更早暴露 delivery risk",
        ],
        sections: [
          createSection(
            "visibility 从 stage 设计开始",
            "workflow 是否清楚，取决于 stage 是否表达真实转移。",
            "如果状态过于笼统，团队永远看不出工作是在 review、在等待另一个角色、还是其实已经 blocked。好的 visibility，先来自 stage 的语义清晰。",
            [
              "用真实协作 transition 来定义 stage。",
              "把 active progress、waiting 和 blocked 分开。",
              "保持 stage 足够简单，让团队愿意相信它。",
            ],
          ),
          createSection(
            "每个 stage 都应该带有 owner 意义",
            "团队需要知道的不只是 work 在哪，还包括谁能推动它。",
            "在远程团队里，这一点尤其重要，因为状态一变，下一位 owner 很可能并不在线。清楚的 owner 可见性可以减少静默停滞。",
            [
              "同时显示 stage owner 和当前 issue owner。",
              "把 next action 一并暴露在同一个视图里。",
              "让 linked doc 和 decision 解释这个状态为什么成立。",
            ],
          ),
          createSection(
            "visibility 的目标是减少会议，而不是把会议画成看板",
            "好的 visibility 是让每个人都能自己看懂当前局面。",
            "当团队能扫一眼 workflow 就看出 bottleneck 和 risk，它就不再需要那么多“快速同步一下”“帮我 recap 一下”的动作。",
            [
              "用 workflow 提前发现 bottleneck。",
              "把 blocker 和 digest 与 workflow 结合起来看。",
              "把 workflow 当 operating surface，而不是展示层。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "跨 product、design、engineering、ops 看清真实执行状态",
          "减少状态追问和 recap 请求",
          "把 waiting state 和 handoff 对所有角色都变得可见",
          "在承诺滑动之前更早看见 bottleneck",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("features", "blocker-tracking"),
          getMarketingDetailPath("use-cases", "remote-product-teams"),
        ],
        ctaTitle: "把 workflow visibility 用来创造 momentum，而不是增加 ceremony。",
        ctaDescription:
          "最有价值的 workflow view，是每个角色都能自己看懂现在该发生什么，而不是还要等别人解释一遍。",
      }),
      "use-cases/remote-product-teams": createPage(
        "use-cases",
        "remote-product-teams",
        {
          seo: {
            title: "适合小型远程产品团队的协作软件",
            description:
              "Synaply 适合 3 到 15 人的远程跨职能团队，把 projects、issues、workflows、docs、blocker 和 async updates 串成一个共享执行语境。",
            keywords: [
              "远程产品团队协作",
              "小团队协作软件",
              "跨职能团队协作软件",
              "远程执行工具",
              "异步协作平台",
            ],
            breadcrumbLabel: "远程产品团队",
          },
          eyebrow: "场景 / 远程产品团队",
          title: "当团队还不大，但角色已经很杂时，需要的是更清楚的协作软件。",
          summary:
            "Synaply 更适合那些已经跨 product、design、engineering、ops 协作，但又不想上来就用重型 enterprise PM 套件的小型远程团队。",
          cardDescription:
            "面向 3-15 人 product、design、engineering、ops 团队的更克制远程协作软件。",
          highlights: [
            "核心角色在同一 execution context 里推进",
            "减少靠会议维持协作秩序",
            "有结构，但不重型",
          ],
          sections: [
            createSection(
              "这类团队最常见的问题",
              "它们通常不是缺工具，而是工具之间缝太多。",
              "问题往往不是没有 ticket，而是 context 在 project、issue、doc、review、blocker 和 chat 之间不断散落，导致每次推进都要重新拼装信息。",
              [
                "产品背景在 design 和 engineering 之间逐渐失真。",
                "docs 和 decisions 离实际 work item 越来越远。",
                "进度变得依赖个人 follow-up 习惯，而不是产品设计。",
              ],
            ),
            createSection(
              "为什么 Synaply 更适合这种团队形状",
              "因为它不是想做更大、更全，而是想做更连贯。",
              "Projects 定义 scope，issues 承接动作，workflows 显示 transition，docs 保留 why，digest / inbox 解释 what changed。它的价值来自这一整条链的连贯，而不是单点功能堆叠。",
              [
                "让 project scope 和 delivery movement 在一条链上。",
                "让 handoff 成为显式事件，而不是隐式切换。",
                "让 blocker 和 digest 成为远程协作节奏的一部分。",
              ],
            ),
            createSection(
              "谁不适合用这种逻辑来选工具",
              "如果你的核心痛点不是 execution clarity，就不一定要选 Synaply。",
              "需要 built-in chat、重型 planning、资源排期或超大规模 enterprise 配置的团队，可能更适合其它软件。Synaply 更聚焦于小型跨职能团队的 momentum。",
              [
                "不适合 planning-heavy 的大组织。",
                "不想把 chat 变成产品重心。",
                "更适合重视 clarity、handoff 和 visible execution 的团队。",
              ],
            ),
          ],
          checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
          checklist: [
            "把 product、design、engineering、ops 收进同一条执行链",
            "在更少会议里保持远程团队同频",
            "让 blocker、handoff 和 decision 都变成可见对象",
            "寻找比泛项目管理工具更聚焦的小团队协作软件",
          ],
          relatedPaths: [
            getMarketingDetailPath("features", "handoffs"),
            getMarketingDetailPath("templates", "product-brief"),
            getMarketingDetailPath("compare", "linear-alternative"),
          ],
          ctaTitle: "给整个团队建立更 calm 的 operating rhythm。",
          ctaDescription:
            "如果你们现在最耗能的事情，是在多个工具之间来回补 context，那就该先解决 execution chain 的连贯性，而不是继续加模块。",
        },
      ),
      "use-cases/design-engineering-handoff": createPage(
        "use-cases",
        "design-engineering-handoff",
        {
          seo: {
            title: "适合远程团队的设计到工程交接流程",
            description:
              "用 Synaply 把 design review、approval、open question 和 engineering takeover 串成一个清楚的交接流程，减少 recap meeting。",
            keywords: [
              "设计到工程交接",
              "设计交接流程",
              "远程设计 review",
              "工程接手流程",
              "跨角色交接",
            ],
            breadcrumbLabel: "设计到工程交接",
          },
          eyebrow: "场景 / 设计到工程交接",
          title: "让 design handoff 清楚到 engineering 不需要再开一场 recap call。",
          summary:
            "这个场景适合那些经常在 design file、comment、issue 和 chat 之间来回切换，最后工程接手时还要重新拼上下文的团队。",
          cardDescription:
            "用 reviewed design、linked rationale 和明确 takeover point 支撑工程接手。",
          highlights: [
            "review 结果不再散落成 comment pile",
            "engineering takeover point 显式存在",
            "减少接手前的重复解释和反向追问",
          ],
          sections: [
            createSection(
              "这条交接链最常断在哪里",
              "很多团队以为“设计评审完了”就等于 ready for engineering。",
              "实际上工程还需要 acceptance context、tradeoff、未决问题和最后一次 decision change。没有这些，implementation 开始前往往还要补一场同步。",
              [
                "comment 在一个地方，rationale 在另一个地方，issue 又在第三个地方。",
                "ownership 切换经常是默认发生，而不是显式记录。",
                "工程把第一天花在还原上下文上。",
              ],
            ),
            createSection(
              "一个好的 handoff packet 应该包含什么",
              "交接包应该是一个紧凑但完整的 operating packet。",
              "接手方需要知道 build 什么、哪些点已经确认、哪些问题还开着、哪些地方必须高保真、哪些可以工程判断，而不是再自己反推。",
              [
                "把 design file、decision note 和 issue scope 绑在一起。",
                "记录 approved / pending / escalate 的边界。",
                "明确 handoff 后谁负责 next move。",
              ],
            ),
            createSection(
              "Synaply 在这条链里应该扮演什么角色",
              "它不是再给团队加一个 comment feed，而是把 transition 变成显式 operating event。",
              "设计交接给工程时，workflow stage、issue 状态、review 摘要和 linked doc 应该在同一个 execution chain 里，从而让 implementation 是继续推进，而不是重新开始。",
              [
                "用 visible stage 表示 design-ready 和 engineering-ready。",
                "在 handoff 前把 review summary / decision log 挂到 item 上。",
                "把后续确认作为 follow-up action 继续留在同一个链条里。",
              ],
            ),
          ],
          checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
          checklist: [
            "从 reviewed design 平滑过渡到 engineering implementation",
            "给工程一个更清楚的 takeover point 和 artifact package",
            "在代码开始前把 open question 和 tradeoff 留清楚",
            "减少设计与工程之间反复 recap 的沟通成本",
          ],
          relatedPaths: [
            getMarketingDetailPath("features", "handoffs"),
            getMarketingDetailPath("templates", "design-review"),
            getMarketingDetailPath("features", "decision-log"),
          ],
          ctaTitle: "把 handoff 当成 operating step，而不只是状态切换。",
          ctaDescription:
            "当设计和工程共享同一条 transition、同一组 decision 和同一套 docs 时，implementation 会开始得更快，也更少返工。",
        },
      ),
      "use-cases/async-release-planning": createPage(
        "use-cases",
        "async-release-planning",
        {
          seo: {
            title: "适合远程团队的异步发布推进流程",
            description:
              "用可见 blocker、release checklist、pending confirmation 和 digest update 来推动异步发布，让团队少开会也能看清 readiness。",
            keywords: [
              "异步发布推进",
              "release planning",
              "远程发布协作",
              "发布 checklist",
              "launch planning",
            ],
            breadcrumbLabel: "异步发布推进",
          },
          eyebrow: "场景 / 异步发布推进",
          title: "让 release planning 在异步环境里也能看得清、推得动。",
          summary:
            "发布工作天然跨 product、design、engineering、ops 和 support。Synaply 的价值，是让 blocker、pending confirmation、checklist 和 decision 都在同一条 release story 里被看见。",
          cardDescription:
            "用 blocker、checklist 和确认状态支撑远程团队的异步发布推进。",
          highlights: [
            "跨角色 release 状态对所有人可见",
            "pending confirmation 不再埋在聊天里",
            "launch update 更适合 digest 节奏",
          ],
          sections: [
            createSection(
              "release planning 需要的不只是一个日期",
              "发布不会因为日历上写了上线日就自动发生。",
              "真正推动 release 的，是 readiness、dependency、owner 和 confirmation 是否都足够清楚。它们应该留在同一个 operating view 里，而不是散在多个表格和频道。",
              [
                "用 item state 看 readiness，而不是只靠乐观口头状态。",
                "把 blocked、pending、ready 明确分开。",
                "把 release checklist 和 decision 挂在同一个语境里。",
              ],
            ),
            createSection(
              "为什么 async planning 也能成立",
              "问题通常不是 async，本质上是结构太弱。",
              "当不同角色都能 self-serve 当前状态，看到 blocker 和 next checkpoint，release 推进就不必依赖一轮轮同步会来维持秩序。",
              [
                "用一个共享 checklist，而不是多个并行 note。",
                "把关键变化整理成 digest，而不是零碎报告。",
                "只把真正需要同步决策的问题升级出来。",
              ],
            ),
            createSection(
              "Synaply 应该如何支撑这条流程",
              "重点不是做一张更复杂的发布表，而是做一条更连贯的 release chain。",
              "issue movement、blocker status、decision log 和 launch doc 应该共同构成同一个视图，让 stakeholder 能快速扫描并做出判断。",
              [
                "把与 release 相关的 issue 组织成清楚的 operating 视图。",
                "让 decision 和 risk note 紧贴 release plan，而不是另存归档。",
                "用 digest 模式输出异步的 launch status。",
              ],
            ),
          ],
          checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
          checklist: [
            "在不增加 recurring meeting 的前提下推进 launch work",
            "让 readiness、blocker 和 pending confirmation 一起可见",
            "把 checklist、decision 和实际执行对象连起来",
            "用更 calm 的方式更新 stakeholder",
          ],
          relatedPaths: [
            getMarketingDetailPath("templates", "release-checklist"),
            getMarketingDetailPath("features", "async-digest"),
            getMarketingDetailPath("features", "blocker-tracking"),
          ],
          ctaTitle: "让 release planning 成为一条 visible workflow，而不是一场状态追逐。",
          ctaDescription:
            "当 blocker、confirmation 和 readiness 足够清楚时，远程团队就能用更少会议推进发布，而不是靠不断同步来兜底。",
        },
      ),
      "templates/product-brief": createPage("templates", "product-brief", {
        seo: {
          title: "适合远程产品团队的 Product Brief 模板结构",
          description:
            "用 product brief 模板定义问题、scope、constraint、stakeholder 与 next action，让跨职能远程团队在执行前先站到同一语境里。",
          keywords: [
            "product brief 模板",
            "项目 brief 模板",
            "远程产品 brief",
            "跨职能规划模板",
            "产品规划模板",
          ],
          breadcrumbLabel: "Product Brief 模板",
        },
        eyebrow: "模板 / Product Brief",
        title: "brief 的作用不是写长，而是让团队在 work 分叉前先对齐。",
        summary:
          "好的 product brief 能让 product、design、engineering、ops 在执行开始前就共享问题定义、scope、constraint 和下一步动作，而不是等工作展开后再到处补背景。",
        cardDescription:
          "围绕问题定义、scope、constraint 和 next action 的 concise brief 结构。",
        highlights: [
          "先把问题和边界讲清楚，再让工作分叉",
          "减少后续交接时重复解释背景",
          "让 brief 直接映射到 project 和 issues",
        ],
        sections: [
          createSection(
            "brief 至少应该包含什么",
            "有用的 brief 是结构化的，而不是信息堆砌。",
            "团队需要知道问题是什么、目标结果是什么、有哪些限制、谁会被影响、以及哪些不在当前 scope 内。超过这个边界的内容，不一定要提前写很长。",
            [
              "用清楚语言定义问题和目标结果。",
              "写出 success condition、constraint 和 non-goal。",
              "列出 stakeholder、依赖和关键假设。",
            ],
          ),
          createSection(
            "brief 应该怎样通向 execution",
            "如果 brief 只能躺在文档库里，它就很快失去价值。",
            "最有效的 brief 会自然过渡到 project、issue、design review 和 workflow movement，让团队后续仍然能回到它，而不是重新解释一遍为什么要做。",
            [
              "把 brief 拆成 milestone、issue 或 review 入口。",
              "从 brief 直接链接 decision 或 open question。",
              "让 handoff 时继续引用同一份 brief。",
            ],
          ),
          createSection(
            "Synaply 应该如何承接这个模板",
            "brief 应该活在 work 附近，而不是独立归档。",
            "Synaply 的优势，是让 originating brief、当前 workflow 和 downstream task 保持一条链，这样项目在推进时依然能回到原始目标和边界。",
            [
              "把 brief 挂在 project 上，而不是丢进独立 docs 角落。",
              "当 tradeoff 改变时，从 issue 回链到 brief。",
              "在 digest 或 release update 中继续复用这份背景。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "在多个角色真正开始工作前先共享 scope",
          "减少 planning 到 handoff 之间的背景流失",
          "让 strategy 与 execution 保持同一条链",
          "为远程产品协作建立更稳的起点",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "remote-product-teams"),
          getMarketingDetailPath("templates", "decision-log"),
          getMarketingDetailPath("features", "handoffs"),
        ],
        ctaTitle: "让 brief 成为执行链的第一环，而不是孤立文档。",
        ctaDescription:
          "当 brief 和 project、issue、workflow 连在一起时，团队会更少重启背景说明，也更容易在复杂协作里保持方向感。",
      }),
      "templates/design-review": createPage("templates", "design-review", {
        seo: {
          title: "适合设计评审与工程交接的 Design Review 模板",
          description:
            "用 design review 模板记录 approval、open question、tradeoff 与 handoff readiness，让设计到工程交接更清楚。",
          keywords: [
            "design review 模板",
            "设计评审模板",
            "设计交接模板",
            "设计到工程交接",
            "远程设计评审",
          ],
          breadcrumbLabel: "Design Review 模板",
        },
        eyebrow: "模板 / Design Review",
        title: "设计评审模板真正要输出的，是一个更可交接的结果包。",
        summary:
          "好的 design review 不是收集更多 comment，而是把 approval、open question、tradeoff 和工程接手边界整理成一个 compact 的 review result。",
        cardDescription:
          "围绕 approval、tradeoff 和 handoff readiness 的设计评审结构。",
        highlights: [
          "评审结果比 comment pile 更清楚",
          "approval 状态和 open question 支持交接",
          "让 engineering 接手时不必再猜",
        ],
        sections: [
          createSection(
            "评审真正应该回答什么",
            "评审不只是“看过了”，而是让 ambiguities 收敛。",
            "一份好的 review output 应该让团队知道哪里已经定、哪里未定、哪里可灵活实现、哪里必须高保真，以及为什么最后做了这样的 tradeoff。",
            [
              "记录清楚的 decision outcome，而不是只留讨论。",
              "给 unresolved question 指定 owner 和 follow-up 路径。",
              "标出哪些细节是 implementation 不能轻易改动的。",
            ],
          ),
          createSection(
            "review 如何自然进入 handoff",
            "最强的 review 会留下一个工程可直接接手的 packet。",
            "如果工程仍然要自己去 comment 里还原答案，说明评审模板还不够好。评审的职责之一，就是减少接手前的再同步成本。",
            [
              "把 review result 直接挂到相关 issue 或 project 上。",
              "如果 review 中改变了 scope，要在这里总结清楚。",
              "把关键 decision log 一起挂上，形成 handoff packet。",
            ],
          ),
          createSection(
            "Synaply 应该如何让这个模板更有价值",
            "模板一旦离开 execution，就会迅速变成静态文档。",
            "Synaply 应该让 review summary、workflow transition 和接手 owner 彼此相邻，这样 design → engineering 的转移会像接力一样，而不是重新开一局。",
            [
              "让 review note 靠近 workflow item。",
              "让 digest 或 release update 复用 review 结果。",
              "让 handoff 一直到 implementation 真正开始前都保持可见。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "标准化设计评审输出，而不是只留下评论堆",
          "在 engineering 开工前明确 approval state",
          "打包 open question 和 tradeoff，提升交接质量",
          "减少“评审之后又改了什么”的模糊感",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "design-engineering-handoff"),
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("features", "handoffs"),
        ],
        ctaTitle: "让评审结果真正服务下一次 handoff。",
        ctaDescription:
          "如果下一位 owner 能直接基于 review output 行动，设计评审就不再只是一次讨论，而是一段真正推动 execution 的流程。",
      }),
      "templates/release-checklist": createPage(
        "templates",
        "release-checklist",
        {
          seo: {
            title: "适合异步发布推进的 Release Checklist 模板",
            description:
              "用 release checklist 模板跟踪 readiness、dependency、pending confirmation 和 owner，让远程团队以更少会议推进 launch。",
            keywords: [
              "release checklist 模板",
              "发布 checklist 模板",
              "launch planning 模板",
              "异步发布流程",
              "release readiness 模板",
            ],
            breadcrumbLabel: "Release Checklist 模板",
          },
          eyebrow: "模板 / Release Checklist",
          title: "release checklist 的价值，是把 readiness 和 risk 放在一起看清楚。",
          summary:
            "release checklist 不应该只是“再多一个列表”。它应该帮助团队同时看见 readiness、dependency、owner 和 pending confirmation，从而在远程协作里更稳地推进发布。",
        cardDescription:
          "围绕 readiness、blocker、confirmation 和 owner 的发布模板结构。",
        highlights: [
          "用真实状态判断 readiness",
          "按角色分配 checklist owner",
          "让 launch update 能直接长出来",
        ],
        sections: [
          createSection(
            "checklist 应该覆盖哪些内容",
            "真正有用的 checklist 要同时覆盖验证、依赖和沟通层面。",
            "除了工程准备好没有，团队还需要知道 product、ops、communication 等环节各自是否 ready，以及谁还需要确认。",
            [
              "按 product、engineering、ops、communication 分区组织。",
              "把 blocked item 明确标出来，而不是藏在备注里。",
              "显示哪些 confirmation 仍然 pending，以及由谁给出。",
            ],
          ),
          createSection(
            "怎样避免 checklist 变成一份自我安慰文档",
            "关键是让 checklist 映射真实 execution 状态。",
            "如果它与 issue、blocker、decision 完全断开，就会越来越不可信。越接近实际执行对象，checklist 就越能反映真实 readiness。",
            [
              "让 checklist item 绑定对应 work object。",
              "使用 ready / pending / blocked 这类可判断状态。",
              "尽量让 workflow movement 驱动 checklist 更新。",
            ],
          ),
          createSection(
            "Synaply 如何承接这个模板",
            "release checklist 应该与 release workflow 并排存在，而不是独立孤岛。",
            "当 checklist、decision、blocker 和 digest 在一个 operating view 里时，stakeholder 可以更轻松地 self-serve 当前进度，而不是等待某个人再写一版总结。",
            [
              "把 checklist 挂到 release project 或 workflow board。",
              "从 checklist 和 workflow 里直接抽 digest summary。",
              "把它沉淀成可复用 launch pattern，而不是每次从零做。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "把 launch readiness 变得可见、可讨论",
          "在异步环境里协同 product、engineering、ops 和 communication",
          "分清哪些 checklist item 是 blocked，哪些只是 pending",
          "用更少手工重写来更新发布状态",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "async-release-planning"),
          getMarketingDetailPath("features", "async-digest"),
          getMarketingDetailPath("features", "blocker-tracking"),
        ],
        ctaTitle: "让 checklist 直接反映真实 launch readiness。",
        ctaDescription:
          "当 checklist 和 workflow、blocker、decision 绑在一起时，它就不只是一个清单，而是一套稳定的 release operating pattern。",
        },
      ),
      "templates/decision-log": createPage("templates", "decision-log", {
        seo: {
          title: "适合产品与工程团队的 Decision Log 模板",
          description:
            "用 decision log 模板记录结论、理由、owner 和影响对象，让远程团队把 rationale 留在执行对象附近。",
          keywords: [
            "decision log 模板",
            "决策记录模板",
            "产品决策模板",
            "工程决策模板",
            "决策留痕模板",
          ],
          breadcrumbLabel: "Decision Log 模板",
        },
        eyebrow: "模板 / Decision Log",
        title: "decision log 模板应该让 rationale 在 handoff 里可复用，而不是只做归档。",
        summary:
          "最好的 decision log 是简洁而具体的。它让接手的人不需要翻整个讨论历史，也能知道做了什么决定、为什么这样做、以及它影响到哪里。",
        cardDescription:
          "围绕结论、理由、owner 和 affected work 的决策记录模板。",
        highlights: [
          "一条记录只承载一个清晰结论",
          "用 enough rationale 减少重复争论",
          "让 decision 与受影响的 work object 连起来",
        ],
        sections: [
          createSection(
            "模板应该强迫团队写清楚什么",
            "模板的价值，在于推动具体化。",
            "团队应该被要求写出决策结论、为什么这么做、谁做了决定、影响了哪些对象，以及后续需要触发哪些动作，这样记录才真正可用。",
            [
              "用 plain language 写结论。",
              "记录关键 tradeoff 和 rationale。",
              "把 decision 与 project、issue、release 关联起来。",
            ],
          ),
          createSection(
            "为什么这个模板对跨角色协作有价值",
            "因为 handoff 时最怕 why 丢失。",
            "如果产品、设计、工程、ops 都能用同一套结构记录 decision，那么 review、handoff、release 中的“背景补课”会明显减少。",
            [
              "用同一格式记录 planning、review、release 中的 decision。",
              "在 ownership 或 scope 改变时引用这条记录。",
              "让 workflow state 的变化有可追溯原因。",
            ],
          ),
          createSection(
            "Synaply 应该怎么支撑这个模板",
            "模板一旦在产品中可轻松创建和回看，就会变成 operating memory。",
            "Synaply 最适合让决策记录从 active execution 对象里直接长出来，再在后续 handoff、blocker review 和 digest 中被反复使用。",
            [
              "从 issue 或 project 直接创建 decision entry。",
              "在 review doc 和 release plan 中继续引用。",
              "让最新有效 decision 易于定位，同时保留历史。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "用更稳定的格式保留 rationale",
          "让 scope change 与 execution item 挂钩",
          "减少 planning、review 和 release 中的重复争论",
          "形成可复用的决策 operating pattern",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("templates", "product-brief"),
          getMarketingDetailPath("features", "handoffs"),
        ],
        ctaTitle: "让同一种 decision 结构贯穿整个 execution chain。",
        ctaDescription:
          "当团队能轻松创建、链接和回看 decision 时，它就会从“事后记录”变成真正可复用的协作基础设施。",
      }),
      "integrations/github": createPage("integrations", "github", {
        seo: {
          title: "围绕 GitHub 建立更清楚的跨角色协作桥接",
          description:
            "让 GitHub 继续做工程执行中心，让 Synaply 承担跨 product、design、engineering、ops 的协调上下文，把 review、blocker 和 release 信号组织得更清楚。",
          keywords: [
            "GitHub 集成",
            "GitHub bridge",
            "GitHub 协作流程",
            "工程执行可见性",
            "跨角色协作",
          ],
          breadcrumbLabel: "GitHub",
        },
        eyebrow: "集成 / GitHub",
        title: "GitHub 继续负责代码执行，而 Synaply 负责跨角色上下文。",
        summary:
          "工程执行天然更适合留在 GitHub，但围绕代码变更的 project context、release risk、handoff 和 digest，往往需要一个更适合跨角色协作的 operating surface。Synaply 应该站在这个位置上。",
        cardDescription:
          "围绕 GitHub 工程执行，补足更适合跨角色协作的 workflow context。",
        highlights: [
          "GitHub 负责 code review 与工程执行",
          "Synaply 负责 project、blocker、release 等跨角色上下文",
          "让非工程角色也能看懂 code work 的业务意义",
        ],
        sections: [
          createSection(
            "GitHub 擅长的部分不该被替代",
            "GitHub 本来就应该继续做工程执行源。",
            "问题不在于 GitHub 不够强，而在于围绕代码工作的更广协作语境，不一定适合长期停留在工程语境里被其他角色消费。",
            [
              "让 GitHub 继续承接 code、PR 和 engineering review。",
              "不要把 Synaply 做成 GitHub 的复制版。",
              "保留工程执行的专业工作流边界。",
            ],
          ),
          createSection(
            "Synaply 在 GitHub 外围最该承接什么",
            "真正需要被补上的，是跨角色 execution context。",
            "产品、设计、工程、运营并不总需要看 PR 细节，但它们需要理解：这段工程工作影响了哪个 project、卡在哪个 blocker、会不会影响 release，以及现在谁需要接下一步。",
            [
              "把 GitHub 相关工作挂回 project、blocker 和 decision。",
              "让非工程角色看到更清楚的 release 和 handoff 状态。",
              "通过 async digest 输出围绕代码工作的变化摘要。",
            ],
          ),
          createSection(
            "GitHub bridge 的边界应该怎么定",
            "越轻量，越不容易把产品带偏。",
            "目标不是同步每个 commit，而是只引入那些会改变 owner、decision 或 release 风险的信号，让 Synaply 保持清楚的协作定位。",
            [
              "优先围绕 issue、handoff、release 级别的信号做桥接。",
              "减少低信号事件同步到协作层。",
              "把 GitHub 看作 execution source，而不是唯一进度解释界面。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "让工程执行与更广的 cross-functional workflow 连起来",
          "让非工程角色不必时时进 GitHub 也能理解进度",
          "把 release 和 blocker context 更贴近代码工作",
          "避免把 Synaply 做成另一个 engineering dashboard",
        ],
        relatedPaths: [
          getMarketingDetailPath("integrations", "slack"),
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("use-cases", "async-release-planning"),
        ],
        ctaTitle: "让 GitHub 和 Synaply 各自承担最适合它们的职责。",
        ctaDescription:
          "最健康的组合，是保留 GitHub 的工程中心地位，同时给整个团队一个更适合看 execution context 的协作层。",
      }),
      "integrations/slack": createPage("integrations", "slack", {
        seo: {
          title: "围绕 Slack 建立更好的异步协作信号桥接",
          description:
            "让 Slack 负责 signal，让 Synaply 保留 system of record，把 blocker、handoff 和 digest update 从聊天记录里解放出来。",
          keywords: [
            "Slack 集成",
            "Slack bridge",
            "异步协作通知",
            "system of record",
            "远程团队状态同步",
          ],
          breadcrumbLabel: "Slack",
        },
        eyebrow: "集成 / Slack",
        title: "Slack 负责提醒 attention，Synaply 负责保留 context。",
        summary:
          "远程团队离不开 Slack，但 chat 不是保存 blocker、decision 和 handoff state 的好地方。更合适的方式，是让 Slack 做 signal layer，而 Synaply 保留结构化执行上下文。",
        cardDescription:
          "用 Slack 做 signal，用 Synaply 做 context，让异步协作更稳而不是更吵。",
        highlights: [
          "Slack 用于提醒，不承担 durable state",
          "减少状态埋进 chat history 的情况",
          "更适合远程团队的 async rhythm",
        ],
        sections: [
          createSection(
            "chat 适合做什么，不适合做什么",
            "Slack 适合 attention routing，不适合长期承载 execution memory。",
            "一旦 blocker、decision 和 handoff state 长期只留在频道里，团队后续就必须用更多 follow-up 去弥补上下文流失。",
            [
              "让 Slack 负责提醒变化和推动注意力。",
              "把 structured state 留在 Synaply，而不是留在对话流里。",
              "避免把关键协作上下文全押在 channel memory 上。",
            ],
          ),
          createSection(
            "bridge 真正应该传递什么",
            "最有价值的是会改变 owner 或 risk 的信号。",
            "Synaply 应该把 blocker、handoff、approval、digest 这种高信号变化推到 Slack，但不要把每次小更新都变成噪音。",
            [
              "只推送 owner、blocker、approval、release 相关的重要变化。",
              "消息里用链接把人带回执行对象，而不是复制整段上下文。",
              "利用 digest 机制做信息批处理，而不是实时刷屏。",
            ],
          ),
          createSection(
            "什么样的 Slack bridge 最健康",
            "不是更热闹，而是更克制。",
            "最好的 Slack bridge 会让团队更快知道“发生了什么”，同时仍然愿意回到 Synaply 看清楚“这意味着什么、接下来该做什么”。",
            [
              "减少低信号更新进入 chat。",
              "把通知和真正需要的 action、object 绑定起来。",
              "让消息比目标页面更短，而不是反过来。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "避免 blocker 和 decision 淹没在聊天历史里",
          "把关键 workflow signal 推到 Slack，又不刷屏",
          "给 chat 一个更清楚的 system of record 回链",
          "改善 async awareness，但不增加噪音",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "async-digest"),
          getMarketingDetailPath("features", "handoffs"),
          getMarketingDetailPath("integrations", "github"),
        ],
        ctaTitle: "让 Slack 负责 attention，而让 Synaply 负责 clarity。",
        ctaDescription:
          "好的 bridge 会让团队知道什么时候该注意，但不会把真正需要判断和执行的上下文都挤进聊天界面里。",
      }),
      "compare/linear-alternative": createPage("compare", "linear-alternative", {
        seo: {
          title: "Linear Alternative：更适合远程跨职能产品团队的选择",
          description:
            "如果你的团队不仅需要 issue flow，还需要 handoff、docs、blocker visibility 和 async coordination，那么 Synaply 会比 Linear 更贴近小型远程团队的 execution shape。",
          keywords: [
            "Linear alternative",
            "Linear 替代方案",
            "Linear vs Synaply",
            "跨职能协作工具",
            "远程产品团队协作",
          ],
          breadcrumbLabel: "Linear Alternative",
        },
        eyebrow: "对比 / Linear Alternative",
        title: "当团队的痛点不只是 issue flow，而是 cross-role execution 时，Synaply 更适合。",
        summary:
          "Linear 对 issue 驱动的执行体验非常强，但如果团队真正卡在 docs、handoff、blocker、release coordination 和 async rhythm 上，Synaply 的 operating model 会更贴近问题本身。",
        cardDescription:
          "面向需要更多 handoff、docs 和 blocker context 的远程产品团队对比页。",
        highlights: [
          "更适合 product、design、engineering、ops 在同一流程里协作",
          "更强调 docs、handoff 与 blocker 的一体化",
          "更接近面向远程团队的协作软件，而不只是 issue flow",
        ],
        sections: [
          createSection(
            "Linear 擅长什么",
            "Linear 在 issue flow 和工程邻近的执行体验上非常强。",
            "如果团队主要关心 issue 的速度和整洁性，这套模式会很舒服。但当跨角色协作成为主要摩擦点时，issue flow 本身可能不够承载所有执行上下文。",
            [
              "非常适合 issue 驱动的推进方式。",
              "对工程侧 workflow 和节奏很友好。",
              "对 docs、decision、handoff 的一体化承载相对更弱。",
            ],
          ),
          createSection(
            "Synaply 的差异点在哪里",
            "Synaply 不是在比“谁功能更多”，而是在比 operating model。",
            "它更强调 projects、issues、workflows、docs 之间的连贯，以及 handoff、blocker、digest 这些远程跨角色团队真正经常失速的点。",
            [
              "更明确支持 product、design、engineering、ops 之间的 handoff。",
              "更强调 docs 和 decision 紧贴 execution。",
              "更适合 blocker visibility 和 async rhythm 的团队。",
            ],
          ),
          createSection(
            "谁更适合考虑切换",
            "重点不是团队大不大，而是 friction 来自哪里。",
            "如果你们经常因为 review、blocker、why 丢失、release coordination 而失速，那么 Synaply 很可能比纯 issue-first 系统更契合。",
            [
              "很适合 3-15 人远程产品团队。",
              "更适合把 handoff clarity 看得比 issue speed 更重的团队。",
              "不适合只想要更大而全 PM 套件的人群。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "比较 issue-first 工具与跨职能协作软件",
          "判断 docs 和 handoff context 是否需要更靠近 workflow",
          "评估 blocker visibility 和 async coordination 的重要性",
          "为小型远程产品团队寻找更贴合的 execution 工具",
        ],
        relatedPaths: [
          getMarketingDetailPath("use-cases", "remote-product-teams"),
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("templates", "product-brief"),
        ],
        ctaTitle: "按团队真正失速的地方来选系统，而不是只按表面速度来选。",
        ctaDescription:
          "如果问题主要来自 cross-role movement，而不是 ticket 不够多，那么 handoff、blocker 和 docs-in-execution 往往比单纯 issue flow 更重要。",
      }),
      "compare/notion-vs-synaply-for-execution": createPage(
        "compare",
        "notion-vs-synaply-for-execution",
        {
          seo: {
            title: "Notion vs Synaply：Docs 优先还是 Execution 优先？",
            description:
              "如果团队主要需要灵活文档，Notion 很强；如果主要痛点是 handoff、workflow clarity、blocker 和 docs 紧贴交付，那么 Synaply 更适合。",
            keywords: [
              "Notion vs Synaply",
              "Notion 执行管理",
              "docs 工具对比",
              "workflow 协作工具",
              "handoff 软件对比",
            ],
            breadcrumbLabel: "Notion vs Synaply",
          },
          eyebrow: "对比 / Notion vs Synaply",
          title: "当团队的核心瓶颈从文档组织变成 execution flow，Synaply 会更合适。",
          summary:
            "Notion 非常适合灵活文档和知识组织；Synaply 更适合那些已经发现问题不在于“记下来”，而在于 work 怎样沿着 handoff、blocker 和 workflow 真正推进的团队。",
          cardDescription:
            "帮助团队区分：现在更缺 flexible docs，还是更缺 structured execution。",
        highlights: [
          "Notion 强在 flexible docs 和知识组织",
          "Synaply 强在 structured execution 与 handoff flow",
          "决定点在于你的主要瓶颈是 knowledge 还是 coordination",
        ],
        sections: [
          createSection(
            "Notion 最强的地方",
            "当灵活性是第一需求时，Notion 非常强。",
            "如果团队主要在搭知识库、写文档、组织信息，Notion 往往能非常快地满足需求。但这种灵活性也意味着 workflow、blocker、handoff 往往需要团队自己额外维持纪律。",
            [
              "很强的 docs、wiki 和知识结构能力。",
              "适合更自由、更开放的组织方式。",
              "对 blocker、ownership transfer、visible execution 的内建支撑较弱。",
            ],
          ),
          createSection(
            "Synaply 在哪里更有优势",
            "当 execution clarity 比文档灵活性更重要时，Synaply 更贴题。",
            "它更强调 projects、issues、workflows 和 docs 是同一条链，强调 handoff、blocker 和 digest 是 execution 的一部分，而不是额外靠团队自觉维护。",
            [
              "Projects、issues、workflows、docs 被有意连起来。",
              "handoff 和 blocker 被当成 first-class execution event。",
              "更适合远程团队的 async rhythm 和 release coordination。",
            ],
          ),
          createSection(
            "怎么判断应该选哪个",
            "先判断主要摩擦来自哪里。",
            "如果团队最大的问题是知识分散、文档难找，Notion 很可能够用。若团队最大的问题是 work 在角色间推进不稳、why 丢失、状态追问过多，Synaply 会更合适。",
            [
              "主要痛点在 knowledge organization，就偏向 Notion。",
              "主要痛点在 execution flow，就偏向 Synaply。",
              "先分清瓶颈，再谈功能数量。",
            ],
          ),
        ],
        checklistTitle: "当你的团队需要下面这些能力时，这页最 relevant：",
        checklist: [
          "比较 docs-first workspace 和 execution-first 协作软件",
          "判断 workflow clarity 是否已经比 note flexibility 更重要",
          "评估 handoff 和 blocker 应不应该紧贴 docs",
          "为小型远程跨职能团队选更 calm 的系统",
        ],
        relatedPaths: [
          getMarketingDetailPath("features", "decision-log"),
          getMarketingDetailPath("features", "workflow-visibility"),
          getMarketingDetailPath("use-cases", "remote-product-teams"),
        ],
        ctaTitle: "先判断你们最缺的是 knowledge，还是 execution flow。",
        ctaDescription:
          "一旦这个问题想清楚，工具选择往往就更直接了。Synaply 最适合那些真正卡在 handoff、blocker 和 shared execution context 上的团队。",
        },
      ),
    },
  },
};

export function getMarketingResourceBundle(locale: SiteLocale) {
  return marketingResources[resolveMarketingContentLocale(locale)];
}

export function getMarketingHubPage(
  locale: SiteLocale,
  category: MarketingCategoryKey,
) {
  return getMarketingResourceBundle(locale).hubs[category];
}

export function getMarketingPagesForCategory(
  locale: SiteLocale,
  category: MarketingCategoryKey,
) {
  const bundle = getMarketingResourceBundle(locale);

  return Object.values(bundle.pages).filter((page) => page.category === category);
}

export function getMarketingResourcePage(
  locale: SiteLocale,
  category: MarketingCategoryKey,
  slug: string,
) {
  const bundle = getMarketingResourceBundle(locale);
  return bundle.pages[`${category}/${slug}`];
}

export function getMarketingLinkCard(
  locale: SiteLocale,
  path: string,
): MarketingLinkCard | null {
  const bundle = getMarketingResourceBundle(locale);

  if (path in bundle.shared.coreLinks) {
    return bundle.shared.coreLinks[path];
  }

  const hub = Object.values(bundle.hubs).find((item) => item.path === path);

  if (hub) {
    return createCard(hub.seo.breadcrumbLabel, hub.description, hub.path);
  }

  const page = Object.values(bundle.pages).find((item) => item.path === path);

  if (page) {
    return createCard(page.seo.breadcrumbLabel, page.cardDescription, page.path);
  }

  return null;
}

export function getMarketingLinkCards(
  locale: SiteLocale,
  paths: string[],
): MarketingLinkCard[] {
  return paths
    .map((path) => getMarketingLinkCard(locale, path))
    .filter((card): card is MarketingLinkCard => Boolean(card));
}
