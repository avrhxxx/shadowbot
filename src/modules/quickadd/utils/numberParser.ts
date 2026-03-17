// src/modules/quickadd/utils/numberParser.ts

/**
 * Parsuje wartości typu:
 * 68.38M → 68380000
 * 320K → 320000
 * 79,242 → 79242
 */
export function parseNumber(value: string): number | null {
  if (!value) return null;

  let cleaned = value.replace(/,/g, "").trim().toUpperCase();

  if (cleaned.endsWith("M")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1_000_000;
  }

  if (cleaned.endsWith("K")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1_000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}