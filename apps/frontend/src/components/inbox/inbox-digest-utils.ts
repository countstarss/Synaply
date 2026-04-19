import type { DocContext, DocKind } from "@/lib/fetchers/doc";
import type { InboxItem } from "@/lib/fetchers/inbox";
import { getDocKindLabel } from "@/components/shared/docs/doc-template-config";

export type InboxDigestTranslationFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function isDocKind(value: unknown): value is DocKind {
  return (
    value === "GENERAL" ||
    value === "PROJECT_BRIEF" ||
    value === "DECISION_LOG" ||
    value === "REVIEW_PACKET" ||
    value === "HANDOFF_PACKET" ||
    value === "RELEASE_CHECKLIST"
  );
}

export function getInboxDigestKinds(
  item: InboxItem,
): Array<{ kind: DocKind; count: number }> {
  const rawKinds = item.metadata?.digestKinds;

  if (!Array.isArray(rawKinds)) {
    return [];
  }

  return rawKinds.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const kind = (entry as { kind?: unknown }).kind;
    const count = (entry as { count?: unknown }).count;

    if (!isDocKind(kind) || typeof count !== "number" || count <= 0) {
      return [];
    }

    return [{ kind, count }];
  });
}

export function getInboxDigestTargetLabel(item: InboxItem) {
  if (
    item.type === "digest.generated" &&
    typeof item.metadata?.digestTargetLabel === "string"
  ) {
    return item.metadata.digestTargetLabel;
  }

  return item.projectName || item.issueKey || null;
}

export function getInboxDigestDisplayTitle(
  item: InboxItem,
  tInbox: InboxDigestTranslationFn,
) {
  const digestDocCount =
    typeof item.metadata?.digestDocCount === "number"
      ? item.metadata.digestDocCount
      : 1;

  if (item.type === "digest.generated") {
    return tInbox("docTitles.digestGenerated", {
      count: digestDocCount,
    });
  }

  return item.title;
}

export function getInboxDigestSummary(
  item: InboxItem,
  locale: string,
  tInbox: InboxDigestTranslationFn,
  tDocs: InboxDigestTranslationFn,
) {
  const digestKinds = getInboxDigestKinds(item);
  const latestDocTitle =
    typeof item.metadata?.latestDocTitle === "string"
      ? item.metadata.latestDocTitle
      : null;

  if (digestKinds.length === 0 && !latestDocTitle) {
    return null;
  }

  const summaryParts: string[] = [];

  if (digestKinds.length > 0) {
    const formatter = new Intl.ListFormat(locale, {
      style: "short",
      type: "conjunction",
    });
    const items = formatter.format(
      digestKinds.map(({ kind, count }) =>
        tInbox("digest.summaryCount", {
          count,
          label: getDocKindLabel(kind, tDocs),
        }),
      ),
    );

    summaryParts.push(tInbox("digest.summaryPrefix", { items }));
  }

  if (latestDocTitle) {
    summaryParts.push(tInbox("digest.summaryLatest", { title: latestDocTitle }));
  }

  return summaryParts.join(" · ");
}

export function resolveInboxDocContext(
  item: InboxItem,
  workspaceType: "PERSONAL" | "TEAM",
): DocContext {
  const rawDocContext =
    typeof item.metadata?.docContext === "string"
      ? item.metadata.docContext
      : null;

  if (
    rawDocContext === "team" ||
    rawDocContext === "team-personal" ||
    rawDocContext === "personal"
  ) {
    return rawDocContext;
  }

  return workspaceType === "TEAM" ? "team" : "personal";
}
