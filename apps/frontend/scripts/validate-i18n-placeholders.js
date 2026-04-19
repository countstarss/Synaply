#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const baseLocale = "en";
const messagesRoot = path.resolve(__dirname, "../src/i18n/messages");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flattenMessages(value, prefix = "", output = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenMessages(item, prefix ? `${prefix}.${index}` : String(index), output);
    });
    return output;
  }

  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      flattenMessages(
        nestedValue,
        prefix ? `${prefix}.${key}` : key,
        output,
      );
    }
    return output;
  }

  output[prefix] = value;
  return output;
}

function getValueAtPath(value, keyPath) {
  return keyPath.split(".").reduce((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    return current[segment];
  }, value);
}

function describeValueType(value) {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;
      continue;
    }

    if (character === separator && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(text.slice(start).trim());
  return parts;
}

function extractOptionKeys(body) {
  const keys = [];
  const issues = [];
  let index = 0;

  while (index < body.length) {
    while (index < body.length && /\s/.test(body[index])) {
      index += 1;
    }

    if (index >= body.length) {
      break;
    }

    const keyStart = index;
    while (index < body.length && !/\s|\{/.test(body[index])) {
      index += 1;
    }

    const key = body.slice(keyStart, index).trim();

    while (index < body.length && /\s/.test(body[index])) {
      index += 1;
    }

    if (body[index] !== "{") {
      issues.push(`Expected "{" after option "${key || "(missing)"}".`);
      break;
    }

    keys.push(key);

    let depth = 0;
    while (index < body.length) {
      const character = body[index];
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      }
      index += 1;
    }

    if (depth !== 0) {
      issues.push(`Unbalanced option block for "${key || "(missing)"}".`);
      break;
    }
  }

  return { keys, issues };
}

function parsePlaceholder(raw) {
  const parts = splitTopLevel(raw, ",");
  const name = (parts[0] || "").trim();
  const type = (parts[1] || "").trim() || null;
  const body = parts.slice(2).join(",").trim();
  const structuredTypes = new Set(["plural", "select", "selectordinal"]);
  const optionResult = structuredTypes.has(type)
    ? extractOptionKeys(body)
    : { keys: [], issues: [] };

  return {
    name,
    type,
    optionKeys: optionResult.keys.sort(),
    issues: optionResult.issues,
  };
}

function extractPlaceholders(message) {
  const placeholders = [];
  const issues = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < message.length; index += 1) {
    const character = message[index];

    if (character === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (character !== "}") {
      continue;
    }

    depth -= 1;

    if (depth < 0) {
      issues.push('Found a closing "}" without a matching opening "{".');
      depth = 0;
      start = -1;
      continue;
    }

    if (depth !== 0 || start < 0) {
      continue;
    }

    const raw = message.slice(start + 1, index).trim();
    const placeholder = parsePlaceholder(raw);
    placeholders.push(placeholder);
    issues.push(...placeholder.issues);
    start = -1;
  }

  if (depth !== 0) {
    issues.push('Found an opening "{" without a matching closing "}".');
  }

  return { placeholders, issues };
}

function signature(placeholder) {
  const type = placeholder.type ?? "";
  const options = placeholder.optionKeys.join("|");
  return `${placeholder.name}::${type}::${options}`;
}

function countSignatures(placeholders) {
  const counts = new Map();

  for (const placeholder of placeholders) {
    const key = signature(placeholder);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function mapsEqual(left, right) {
  if (left.size !== right.size) {
    return false;
  }

  for (const [key, value] of left.entries()) {
    if (right.get(key) !== value) {
      return false;
    }
  }

  return true;
}

function describePlaceholders(placeholders) {
  const counts = countSignatures(placeholders);
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => {
      const [name, type, options] = key.split("::");
      const optionSuffix = options ? ` [${options}]` : "";
      const countSuffix = count > 1 ? ` x${count}` : "";
      return `${name}${type ? `:${type}` : ""}${optionSuffix}${countSuffix}`;
    })
    .join(", ");
}

function collectLocaleFiles(locale) {
  return fs
    .readdirSync(path.join(messagesRoot, locale))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
}

function validate() {
  const locales = fs
    .readdirSync(messagesRoot)
    .filter((entry) => fs.statSync(path.join(messagesRoot, entry)).isDirectory())
    .sort();

  const baseFiles = collectLocaleFiles(baseLocale);
  const errors = [];

  for (const fileName of baseFiles) {
    const basePath = path.join(messagesRoot, baseLocale, fileName);
    const baseMessages = flattenMessages(readJson(basePath));
    const parsedBase = new Map();

    for (const [key, value] of Object.entries(baseMessages)) {
      if (typeof value !== "string") {
        continue;
      }

      const result = extractPlaceholders(value);
      parsedBase.set(key, result);

      if (result.issues.length > 0) {
        errors.push(
          `${baseLocale}/${fileName}:${key} has invalid placeholder syntax in the base locale.`,
        );
      }
    }

    for (const locale of locales) {
      if (locale === baseLocale) {
        continue;
      }

      const localePath = path.join(messagesRoot, locale, fileName);
      if (!fs.existsSync(localePath)) {
        errors.push(`${locale}/${fileName} is missing.`);
        continue;
      }

      const localeMessages = readJson(localePath);

      for (const [key, baseResult] of parsedBase.entries()) {
        const localizedValue = getValueAtPath(localeMessages, key);
        if (localizedValue === undefined) {
          errors.push(`${locale}/${fileName}:${key} is missing.`);
          continue;
        }

        if (typeof localizedValue !== "string") {
          errors.push(
            `${locale}/${fileName}:${key} should be a string to match the base locale, found ${describeValueType(localizedValue)}.`,
          );
          continue;
        }

        const localeResult = extractPlaceholders(localizedValue);
        if (localeResult.issues.length > 0) {
          errors.push(
            `${locale}/${fileName}:${key} has invalid placeholder syntax: ${localeResult.issues.join(" ")}`,
          );
        }

        const baseCounts = countSignatures(baseResult.placeholders);
        const localeCounts = countSignatures(localeResult.placeholders);
        if (!mapsEqual(baseCounts, localeCounts)) {
          errors.push(
            `${locale}/${fileName}:${key} placeholders do not match. Expected: ${describePlaceholders(baseResult.placeholders) || "(none)"}; found: ${describePlaceholders(localeResult.placeholders) || "(none)"}.`,
          );
        }
      }
    }
  }

  if (errors.length === 0) {
    console.log("i18n placeholder validation passed.");
    return;
  }

  console.error("i18n placeholder validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}

validate();
