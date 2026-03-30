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
// 🔹 FACTORY (TYPE ONLY)
// =====================================

const define = <T extends readonly string[]>(
  name: string,
  headers: T
): SheetDefinition => ({
  name,
  headers,
} as const);

// =====================================
// 🔹 MODERATOR
// =====================================

export const MODERATOR_CONFIG_SHEET = define("moderator_config", [
  "id",
  "guildId",
  "modChannelId",
  "updateChannelId",
  "dateEmbedId",
  "hubMessageId",
  "version",
  "lastUpdated",
]);

// =====================================
// 🔹 EVENTS
// =====================================

export const EVENTS_SHEET = define("events", [
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
]);

export const EVENTS_CONFIG_SHEET = define("events_config", [
  "id",
  "guildId",
  "notificationChannel",
  "downloadChannel",
]);

// =====================================
// 🔹 POINTS
// =====================================

export const POINTS_WEEKS_SHEET = define("points_weeks", [
  "id",
  "guildId",
  "category",
  "week",
  "createdAt",
]);

export const POINTS_DONATIONS_SHEET = define("points_donations", [
  "id",
  "guildId",
  "category",
  "nick",
  "points",
  "week",
]);

export const POINTS_DUEL_SHEET = define("points_duel", [
  "id",
  "guildId",
  "category",
  "nick",
  "points",
  "week",
]);

export const POINTS_CONFIG_SHEET = define("points_config", [
  "id",
  "guildId",
]);

// =====================================
// 🔹 ABSENCE
// =====================================

export const ABSENCE_SHEET = define("absence", [
  "id",
  "guildId",
  "player",
  "startDate",
  "endDate",
  "createdAt",
  "year",
]);

export const ABSENCE_CONFIG_SHEET = define("absence_config", [
  "id",
  "guildId",
  "notificationChannel",
  "absenceEmbedId",
]);

// =====================================
// 🔹 TRANSLATION (FUTURE)
// =====================================

export const TRANSLATE_SHEET = define("translate", [
  "id",
  "guildId",
  "key",
  "lang",
  "value",
]);

export const TRANSLATE_CONFIG_SHEET = define("translate_config", [
  "id",
  "guildId",
]);

// =====================================
// 🔹 QUICKADD
// =====================================

export const QUICKADD_NICKNAMES_SHEET = define("quickadd_nicknames", [
  "type",
  "ocr_raw",
  "layout_text",
  "parser_output",
  "adjusted",
  "override",
  "createdAt",
]);

export const QUICKADD_POINTS_QUEUE_SHEET = define("quickadd_points_queue", [
  "guildId",
  "category",
  "week",
  "nickname",
  "points",
  "status",
  "createdAt",
]);

export const QUICKADD_EVENTS_QUEUE_SHEET = define("quickadd_events_queue", [
  "guildId",
  "eventId",
  "type",
  "nickname",
  "status",
  "createdAt",
]);

// =====================================
// 🔹 REGISTRY
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
  QUICKADD_POINTS_QUEUE_SHEET,
  QUICKADD_EVENTS_QUEUE_SHEET,
] as const;

// 🔥 O(1) lookup (VERY IMPORTANT for setup)
export const SHEETS_MAP: Record<string, SheetDefinition> =
  Object.fromEntries(ALL_SHEETS.map((s) => [s.name, s]));

// =====================================
// 🔹 TYPES
// =====================================

export type SheetName = (typeof ALL_SHEETS)[number]["name"];