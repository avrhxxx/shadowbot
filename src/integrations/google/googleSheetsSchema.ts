// =====================================
// 📁 src/integrations/google/googleSheetsSchema.ts
// =====================================

/**
 * 🧠 ROLE:
 * SINGLE SOURCE OF TRUTH for Google Sheets structure
 *
 * Defines:
 * - sheet names
 * - column headers (STRICT ORDER)
 *
 * ❗ HARD RULES:
 * - NO logic
 * - NO imports
 * - NO dynamic columns
 * - MUST match services exactly
 */

// =====================================
// 🔹 TYPE
// =====================================

export type SheetDefinition = Readonly<{
  name: string;
  headers: readonly string[];
}>;

// =====================================
// 🔹 SYSTEM FLAGS (🆕 RUNTIME CORE)
// =====================================

export const SYSTEM_FLAGS_SHEET: SheetDefinition = {
  name: "system_flags",
  headers: [
    "id",
    "system",
    "enabled",
    "reason",
  ],
} as const;

// =====================================
// 🔹 MODERATOR
// =====================================

export const MODERATOR_CONFIG_SHEET: SheetDefinition = {
  name: "moderator_config",
  headers: [
    "id",
    "guildId",
    "modChannelId",
    "updateChannelId",
    "dateEmbedId",
    "hubMessageId",
    "version",
    "lastUpdated",
  ],
} as const;

// =====================================
// 🔹 EVENTS
// =====================================

export const EVENTS_SHEET: SheetDefinition = {
  name: "events",
  headers: [
    "id",
    "guildId",
    "name",
    "eventType",
    "day",
    "month",
    "hour",
    "minute",
    "year",
    "reminderBefore",
    "status",
    "participants",
    "results",
    "absent",
    "createdAt",
    "reminderSent",
    "started",
    "lastBirthdayYear",
  ],
} as const;

export const EVENTS_CONFIG_SHEET: SheetDefinition = {
  name: "events_config",
  headers: [
    "id",
    "guildId",
    "notificationChannel",
    "downloadChannel",
  ],
} as const;

// =====================================
// 🔹 POINTS
// =====================================

export const POINTS_WEEKS_SHEET: SheetDefinition = {
  name: "points_weeks",
  headers: [
    "id",
    "guildId",
    "category",
    "week",
    "createdAt",
  ],
} as const;

export const POINTS_DONATIONS_SHEET: SheetDefinition = {
  name: "points_donations",
  headers: [
    "id",
    "guildId",
    "category",
    "nick",
    "points",
    "week",
  ],
} as const;

export const POINTS_DUEL_SHEET: SheetDefinition = {
  name: "points_duel",
  headers: [
    "id",
    "guildId",
    "category",
    "nick",
    "points",
    "week",
  ],
} as const;

export const POINTS_CONFIG_SHEET: SheetDefinition = {
  name: "points_config",
  headers: [
    "id",
    "guildId",
  ],
} as const;

// =====================================
// 🔹 ABSENCE
// =====================================

export const ABSENCE_SHEET: SheetDefinition = {
  name: "absence",
  headers: [
    "id",
    "guildId",
    "player",
    "startDate",
    "endDate",
    "createdAt",
    "year",
  ],
} as const;

export const ABSENCE_CONFIG_SHEET: SheetDefinition = {
  name: "absence_config",
  headers: [
    "id",
    "guildId",
    "notificationChannel",
    "absenceEmbedId",
  ],
} as const;

// =====================================
// 🔹 TRANSLATION (FUTURE)
// =====================================

export const TRANSLATE_SHEET: SheetDefinition = {
  name: "translate",
  headers: [
    "id",
    "guildId",
    "key",
    "lang",
    "value",
  ],
} as const;

export const TRANSLATE_CONFIG_SHEET: SheetDefinition = {
  name: "translate_config",
  headers: [
    "id",
    "guildId",
  ],
} as const;

// =====================================
// 🔹 QUICKADD
// =====================================

export const QUICKADD_NICKNAMES_SHEET: SheetDefinition = {
  name: "quickadd_nicknames",
  headers: [
    "type",
    "ocr_raw",
    "layout_text",
    "parser_output",
    "adjusted",
    "override",
    "createdAt",
  ],
} as const;

export const QUICKADD_POINTS_QUEUE_SHEET: SheetDefinition = {
  name: "quickadd_points_queue",
  headers: [
    "guildId",
    "category",
    "week",
    "nickname",
    "points",
    "status",
    "createdAt",
  ],
} as const;

export const QUICKADD_EVENTS_QUEUE_SHEET: SheetDefinition = {
  name: "quickadd_events_queue",
  headers: [
    "guildId",
    "eventId",
    "type",
    "nickname",
    "status",
    "createdAt",
  ],
} as const;

// =====================================
// 🔹 REGISTRY
// =====================================

export const ALL_SHEETS = [
  SYSTEM_FLAGS_SHEET, // ✅ MUST BE FIRST (runtime critical)

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
  QUICKADD_POINTS_QUEUE_SHEET,
  QUICKADD_EVENTS_QUEUE_SHEET,
] as const;

// =====================================
// 🔹 TYPES
// =====================================

export type SheetName = (typeof ALL_SHEETS)[number]["name"];