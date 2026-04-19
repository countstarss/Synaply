import assert from "node:assert/strict";
import test from "node:test";

import { filterWorkflowLevelDocs } from "./workflow-doc-utils";

test("workflow doc cards ignore issue-scoped packets", () => {
  const docs = [
    { id: "workflow-doc", issueId: undefined },
    { id: "team-review-packet", issueId: "issue-1" },
    { id: "release-checklist", issueId: null },
  ];

  assert.deepEqual(
    filterWorkflowLevelDocs(docs).map((doc) => doc.id),
    ["workflow-doc", "release-checklist"],
  );
});
