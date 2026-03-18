export function parseNumber(input: string): number | null {
  if (!input) return null;

  let normalized = input.replace(/,/g, "").trim();
  let multiplier = 1;

  if (normalized.endsWith("M")) {
    multiplier = 1_000_000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("K")) {
    multiplier = 1_000;
    normalized = normalized.slice(0, -1);
  }

  const num = parseFloat(normalized);
  if (isNaN(num)) return null;
  return num * multiplier;
}