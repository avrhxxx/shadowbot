// =====================================
// 📁 src/foundation/ids/idConfig.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central configuration for ID system.
 *
 * 📥 INPUT:
 * - none
 *
 * 📤 OUTPUT:
 * - constants used by generator / validator / formatter
 *
 * ❗ RULES:
 * - SINGLE SOURCE OF TRUTH
 * - NO logic besides static definitions
 */

// =====================================
// 🔹 LENGTH
// =====================================

export const ID_LENGTH = 8;

// =====================================
// 🔹 ID TYPES (FULL NAMES)
// =====================================

export const ID_TYPES = {
  trace: "trace",
  flow: "flow",
  correlation: "correlation",

  session: "session",
  job: "job",
  queue: "queue",

  interaction: "interaction",
  external: "external",

  runtime: "runtime",
} as const;

export type IdType = keyof typeof ID_TYPES;

// =====================================
// 🔹 VALIDATION REGEX
// =====================================

export const ID_REGEX = new RegExp(
  `^(${Object.keys(ID_TYPES).join("|")}):[A-Za-z0-9_-]{${ID_LENGTH}}$`
);