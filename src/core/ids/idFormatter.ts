import { DISPLAY_ID_LENGTH, ID_PREFIX_MAP, IdKey } from "./idConfig";

// =====================================
// 🔹 HELPERS
// =====================================

function extractSuffix(id: string): string | null {
  const parts = id.split("_");
  return parts[1] ?? null;
}

// =====================================
// 🔹 DISPLAY
// =====================================

export function toDisplayId(id: string): string {
  const suffix = extractSuffix(id);

  if (!suffix) return id;

  return suffix.slice(0, DISPLAY_ID_LENGTH);
}

export function toDisplayWithPrefix(id: string, key: IdKey): string {
  const short = toDisplayId(id);
  const prefix = ID_PREFIX_MAP[key];

  return `(${prefix}:${short})`;
}