export const DOC_TITLE_MAX_LENGTH = 10;

export function clampDocTitle(value: string, maxLength = DOC_TITLE_MAX_LENGTH) {
  return Array.from(value).slice(0, maxLength).join("");
}

export function normalizeDocTitle(value: string) {
  return clampDocTitle(value.trim());
}

export function buildDuplicatedDocTitle(title: string, suffix: string) {
  const normalizedSuffix = suffix.trim();

  if (!normalizedSuffix) {
    return normalizeDocTitle(title);
  }

  const suffixChars = Array.from(normalizedSuffix);
  const baseChars = Array.from(normalizeDocTitle(title));
  const availableBaseLength = Math.max(0, DOC_TITLE_MAX_LENGTH - suffixChars.length);

  return [...baseChars.slice(0, availableBaseLength), ...suffixChars].join("");
}
