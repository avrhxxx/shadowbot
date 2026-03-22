// src/quickadd/utils/parseValue.ts

// =====================================
// 🔥 DEBUG
// =====================================
const DEBUG_PARSE_VALUE = false; // 🔥 zmien na true jak debugujesz
const DEBUG_PARSE_VALUE_VERBOSE = false;

function log(...args: any[]) {
  if (DEBUG_PARSE_VALUE) {
    console.log("[PARSE_VALUE]", ...args);
  }
}

// =====================================
export function parseValue(input: string): number | null {
  if (!input) return null;

  const original = input;

  let value = input
    .toLowerCase()
    .trim()
    .replace(",", ".")
    .replace(/\s+/g, "");

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

  if (isNaN(num)) {
    log("❌ PARSE FAIL:", original, "→", value);
    return null;
  }

  const finalValue = Math.round(num * multiplier);

  // 🔥 sanity check (anti OCR garbage)
  if (finalValue <= 0 || finalValue > 1_000_000) {
    log("⚠️ OUT OF RANGE:", original, "→", finalValue);
    return null;
  }

  if (DEBUG_PARSE_VALUE_VERBOSE) {
    log("OK:", original, "→", finalValue, "| mult:", multiplier);
  }

  return finalValue;
}