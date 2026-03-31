// =====================================
// 📁 src/core/ids/idConfig.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central configuration for all ID-related settings.
 *
 * ❗ RULES:
 * - Single source of truth for prefixes
 * - Used by generator, guards, utils, display
 * - DO NOT duplicate this logic anywhere else
 */

// =====================================
// 🔹 ID LENGTH
// =====================================

/**
 * Internal ID length (suffix)
 */
export const ID_LENGTH = 8;

/**
 * Default display length
 */
export const DISPLAY_ID_LENGTH = 4;

// =====================================
// 🔹 PREFIX MAP (INTERNAL)
// =====================================

export const ID_PREFIX_MAP = {
  trace: "t",
  session: "s",
  queue: "q",
  job: "j",
  interaction: "i",
  external: "x",
  correlation: "c",
  flow: "f",
  runtime: "r",
} as const;

// =====================================
// 🔹 TYPES
// =====================================

export type IdKey = keyof typeof ID_PREFIX_MAP;
export type IdPrefix = (typeof ID_PREFIX_MAP)[IdKey];

// =====================================
// 🔹 REVERSE LOOKUP (AUTO-GENERATED)
// =====================================

export const PREFIX_TO_KEY_MAP: Record<IdPrefix, IdKey> =
  Object.fromEntries(
    Object.entries(ID_PREFIX_MAP).map(([k, v]) => [v, k])
  ) as Record<IdPrefix, IdKey>;