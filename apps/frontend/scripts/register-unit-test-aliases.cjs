const path = require("node:path");
const Module = require("node:module");

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(
  request,
  parent,
  isMain,
  options,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(
      process.cwd(),
      "node_modules/.cache/unit-tests",
      request.slice(2),
    );

    return originalResolveFilename.call(
      this,
      compiledPath,
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
