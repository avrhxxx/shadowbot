// =====================================
// 📁 src/integrations/google/googleSchema.ts
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
 * - NO logic (except safe helpers)
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

export const SYSTEM_FLAGS_SHEET = {
  name: "system_flags",
  headers: ["id", "system", "enabled", "reason"],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 MODERATOR
// =====================================

export const MODERATOR_CONFIG_SHEET = {
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
} as const satisfies SheetDefinition;

// =====================================
// 🔹 DEVPANEL
// =====================================

export const DEVPANEL_CONFIG_SHEET = {
  name: "devpanel_config",
  headers: [
    "id",
    "guildId",
    "channelId",
    "hubMessageId",
    "lastUpdated",
  ],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 EVENTS
// =====================================

export const EVENTS_SHEET = {
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
} as const satisfies SheetDefinition;

export const EVENTS_CONFIG_SHEET = {
  name: "events_config",
  headers: [
    "id",
    "guildId",
    "notificationChannel",
    "downloadChannel",
  ],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 POINTS
// =====================================

export const POINTS_WEEKS_SHEET = {
  name: "points_weeks",
  headers: ["id", "guildId", "category", "week", "createdAt"],
} as const satisfies SheetDefinition;

export const POINTS_DONATIONS_SHEET = {
  name: "points_donations",
  headers: ["id", "guildId", "category", "nick", "points", "week"],
} as const satisfies SheetDefinition;

export const POINTS_DUEL_SHEET = {
  name: "points_duel",
  headers: ["id", "guildId", "category", "nick", "points", "week"],
} as const satisfies SheetDefinition;

export const POINTS_CONFIG_SHEET = {
  name: "points_config",
  headers: ["id", "guildId"],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 ABSENCE
// =====================================

export const ABSENCE_SHEET = {
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
} as const satisfies SheetDefinition;

export const ABSENCE_CONFIG_SHEET = {
  name: "absence_config",
  headers: [
    "id",
    "guildId",
    "notificationChannel",
    "absenceEmbedId",
  ],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 TRANSLATION (FUTURE)
// =====================================

export const TRANSLATE_SHEET = {
  name: "translate",
  headers: ["id", "guildId", "key", "lang", "value"],
} as const satisfies SheetDefinition;

export const TRANSLATE_CONFIG_SHEET = {
  name: "translate_config",
  headers: ["id", "guildId"],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 QUICKADD
// =====================================

export const QUICKADD_NICKNAMES_SHEET = {
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
} as const satisfies SheetDefinition;

export const QUICKADD_POINTS_QUEUE_SHEET = {
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
} as const satisfies SheetDefinition;

export const QUICKADD_EVENTS_QUEUE_SHEET = {
  name: "quickadd_events_queue",
  headers: [
    "guildId",
    "eventId",
    "type",
    "nickname",
    "status",
    "createdAt",
  ],
} as const satisfies SheetDefinition;

// =====================================
// 🔹 REGISTRY
// =====================================

export const ALL_SHEETS = [
  SYSTEM_FLAGS_SHEET,

  MODERATOR_CONFIG_SHEET,
  DEVPANEL_CONFIG_SHEET, // 🔹 dodany DevPanel

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
] as const satisfies readonly SheetDefinition[];

// =====================================
// 🔹 TYPES
// =====================================

export type SheetName = (typeof ALL_SHEETS)[number]["name"];

// =====================================
// 🔧 HELPERS (SAFE)
// =====================================

export function getSheetByName(name: SheetName): SheetDefinition {
  const sheet = ALL_SHEETS.find((s) => s.name === name);

  if (!sheet) {
    throw new Error(`Sheet "${name}" not found`);
  }

  return sheet;
}

// ✅ FIXED (type-safe)
export const SHEET_MAP: Record<SheetName, SheetDefinition> =
  ALL_SHEETS.reduce((acc, sheet) => {
    acc[sheet.name] = sheet;
    return acc;
  }, {} as Record<SheetName, SheetDefinition>);