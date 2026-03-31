// =====================================
// 🔹 CONFIG
// =====================================

export const ID_LENGTH = 8;
export const DISPLAY_ID_LENGTH = 4;

// =====================================
// 🔹 PREFIX MAP (SSOT)
// =====================================

export const ID_PREFIX_MAP = {
  trace: "trace",
  session: "session",
  queue: "queue",
  job: "job",
  interaction: "interaction",
  external: "external",
  correlation: "correlation",
  flow: "flow",
  runtime: "runtime",
} as const;

// =====================================
// 🔹 TYPES
// =====================================

export type IdKey = keyof typeof ID_PREFIX_MAP;

// =====================================
// 🔁 REVERSE MAP
// =====================================

export const PREFIX_TO_KEY_MAP: Record<string, IdKey> =
  Object.fromEntries(
    Object.entries(ID_PREFIX_MAP).map(([k, v]) => [v, k])
  ) as Record<string, IdKey>;