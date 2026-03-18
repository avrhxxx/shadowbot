
export function parseValue(input: string): number | null {
  if (!input) return null;

  let value = input.toLowerCase().replace(",", ".");

  let multiplier = 1;

  if (value.endsWith("k")) {
    multiplier = 1_000;
    value = value.slice(0, -1);
  } else if (value.endsWith("m")) {
    multiplier = 1_000_000;
    value = value.slice(0, -1);
  }

  const num = Number(value);

  if (isNaN(num)) return null;

  return Math.round(num * multiplier);
}
