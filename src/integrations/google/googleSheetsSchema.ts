// =====================================
// 📁 src/integrations/google/googleSheetsSchema.ts
// =====================================

/**
 * 🧠 ROLE:
 * Single source of truth for ALL Google Sheets structure.
 *
 * Defines:
 * - sheet names
 * - column headers (order matters!)
 *
 * ❗ RULES:
 * - NO logic
 * - NO imports
 * - NO validation (ZOD belongs to system layer)
 */

// =====================================
// 🔹 TYPE
// =====================================

export type SheetDefinition = {
  name: string;
  headers: readonly string[];
};

// =====================================
// 🔹 GLOBAL / MODERATOR
// =====================================

export const MODERATOR_CONFIG_SHEET: SheetDefinition = {
  name: "moderator_config",
  headers: [],
};

// =====================================
// 🔹 EVENTS
// =====================================

export const EVENTS_SHEET: SheetDefinition = {
  name: "events",
  headers: ["id", "name", "date", "participants"],
};

export const EVENTS_CONFIG_SHEET: SheetDefinition = {
  name: "events_config",
  headers: ["key", "value"],
};

// =====================================
// 🔹 POINTS
// =====================================

export const POINTS_WEEKS_SHEET: SheetDefinition = {
  name: "points_weeks",
  headers: ["id", "week", "year"],
};

export const POINTS_DONATIONS_SHEET: SheetDefinition = {
  name: "points_donations",
  headers: ["id", "userId", "amount", "date"],
};

export const POINTS_DUEL_SHEET: SheetDefinition = {
  name: "points_duel",
  headers: ["id", "userA", "userB", "winner", "points"],
};

export const POINTS_CONFIG_SHEET: SheetDefinition = {
  name: "points_config",
  headers: ["key", "value"],
};

// =====================================
// 🔹 ABSENCE
// =====================================

export const ABSENCE_SHEET: SheetDefinition = {
  name: "absence",
  headers: ["id", "userId", "from", "to", "reason"],
};

export const ABSENCE_CONFIG_SHEET: SheetDefinition = {
  name: "absence_config",
  headers: ["key", "value"],
};

// =====================================
// 🔹 TRANSLATION
// =====================================

export const TRANSLATE_SHEET: SheetDefinition = {
  name: "translate",
  headers: ["id", "key", "value", "lang"],
};

export const TRANSLATE_CONFIG_SHEET: SheetDefinition = {
  name: "translate_config",
  headers: ["key", "value"],
};

// =====================================
// 🔹 QUICKADD
// =====================================

export const QUICKADD_NICKNAMES_SHEET: SheetDefinition = {
  name: "quickadd_nicknames",
  headers: ["id", "nickname", "userId"],
};

// 🔥 QUEUES

export const QUICKADD_EVENTS_QUEUE_SHEET: SheetDefinition = {
  name: "quickadd_events_queue",
  headers: ["id", "rawText", "status", "createdAt"],
};

export const QUICKADD_POINTS_QUEUE_SHEET: SheetDefinition = {
  name: "quickadd_points_queue",
  headers: ["id", "rawText", "status", "createdAt"],
};

// =====================================
// 🔹 REGISTRY (ALL SHEETS)
// =====================================

export const ALL_SHEETS = [
  MODERATOR_CONFIG_SHEET,

  EVENTS_SHEET,
  EVENTS_CONFIG_SHEET,

  POINTS_WEEKS_SHEET,
  POINTS_DONATIONS_SHEET,
  POINTS_DUEL_SHEET,
  POINTS_CONFIG_SHEET,

  ABSENCE_SHEET,
  ABSENCE_CONFIG_SHEET,

  TRANSLATE_SHEET,
  TRANSLATE_CONFIG_SHEET,

  QUICKADD_NICKNAMES_SHEET,
  QUICKADD_EVENTS_QUEUE_SHEET,
  QUICKADD_POINTS_QUEUE_SHEET,
] as const;

// =====================================
// 🔹 HELPERS (TYPE ONLY)
// =====================================

export type SheetName = (typeof ALL_SHEETS)[number]["name"];