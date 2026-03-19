export function parseValue(input: string): number | null {
  if (!input) return null;

  let value = input
    .toLowerCase()
    .trim() // 🔥 usuń spacje
    .replace(",", ".") // 🔥 europejskie liczby
    .replace(/\s+/g, ""); // 🔥 usuń WSZYSTKIE spacje

  // 🔥 usuń śmieci OCR z końca
  value = value.replace(/[^0-9.km]+$/g, "");

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