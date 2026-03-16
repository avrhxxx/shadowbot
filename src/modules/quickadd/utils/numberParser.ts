/**
 * numberParser.ts
 *
 * Parser wartości liczbowych z tekstu OCR/manual input
 * Obsługuje np.:
 * - 68.38M
 * - 320K
 * - 79,242
 */

export function parseNumber(value: string): number | null {
  if (!value) return null;

  const cleaned = value.replace(/,/g, "").trim().toUpperCase();

  // Obsługa milionów (M) i tysięcy (K)
  const match = cleaned.match(/^([\d.]+)([MK]?)$/);
  if (!match) return null;

  let num = parseFloat(match[1]);
  const suffix = match[2];

  if (isNaN(num)) return null;

  switch (suffix) {
    case "M": num *= 1_000_000; break;
    case "K": num *= 1_000; break;
  }

  return num;
}