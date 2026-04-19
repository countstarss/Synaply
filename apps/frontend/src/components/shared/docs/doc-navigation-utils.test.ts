import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveDocHref,
  resolveProjectDocsContext,
} from "./doc-navigation-utils";

test("doc navigation keeps team-personal docs on the correct surface", () => {
  assert.equal(resolveDocHref({ context: "team-personal" }), "/personal/doc");
  assert.equal(
    resolveDocHref({
      context: "team-personal",
      projectId: "project alpha",
    }),
    "/projects/project%20alpha/docs?context=team-personal",
  );
  assert.equal(resolveProjectDocsContext("TEAM", "team-personal"), "team-personal");
  assert.equal(resolveProjectDocsContext("TEAM", "team"), "team");
});
