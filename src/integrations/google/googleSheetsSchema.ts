// =====================================
// 📁 src/integrations/google/googleSheetsSchema.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central definition of ALL Google Sheets tabs used in the app.
 *
 * This file:
 * - is the SINGLE SOURCE OF TRUTH for sheet names
 * - prevents magic strings across the codebase
 * - enables safe refactoring and consistency
 *
 * ❗ RULES:
 * - NO logic
 * - NO imports (pure config)
 * - ONLY constants
 */

// =====================================
// 🔹 GLOBAL / MODERATOR
// =====================================

export const MODERATOR_CONFIG_TAB = "moderator_config";

// =====================================
// 🔹 EVENTS
// =====================================

export const EVENTS_TAB = "events";
export const EVENTS_CONFIG_TAB = "events_config";

// =====================================
// 🔹 POINTS
// =====================================

export const POINTS_WEEKS_TAB = "points_weeks";
export const POINTS_DONATIONS_TAB = "points_donations";
export const POINTS_DUEL_TAB = "points_duel";
export const POINTS_CONFIG_TAB = "points_config";

// =====================================
// 🔹 ABSENCE
// =====================================

export const ABSENCE_TAB = "absence";
export const ABSENCE_CONFIG_TAB = "absence_config";

// =====================================
// 🔹 TRANSLATION
// =====================================

export const TRANSLATE_TAB = "translate";
export const TRANSLATE_CONFIG_TAB = "translate_config";

// =====================================
// 🔹 QUICKADD
// =====================================

export const QUICKADD_NICKNAMES_TAB = "quickadd_nicknames";

// 🔥 QUEUES
export const QUICKADD_EVENTS_QUEUE_TAB = "quickadd_events_queue";
export const QUICKADD_POINTS_QUEUE_TAB = "quickadd_points_queue";

// =====================================
// 🔹 GROUPED EXPORT (OPTIONAL)
// =====================================

export const SHEETS = {
  MODERATOR_CONFIG_TAB,

  EVENTS_TAB,
  EVENTS_CONFIG_TAB,

  POINTS_WEEKS_TAB,
  POINTS_DONATIONS_TAB,
  POINTS_DUEL_TAB,
  POINTS_CONFIG_TAB,

  ABSENCE_TAB,
  ABSENCE_CONFIG_TAB,

  TRANSLATE_TAB,
  TRANSLATE_CONFIG_TAB,

  QUICKADD_NICKNAMES_TAB,
  QUICKADD_EVENTS_QUEUE_TAB,
  QUICKADD_POINTS_QUEUE_TAB,
} as const;

export type SheetName = typeof SHEETS[keyof typeof SHEETS];