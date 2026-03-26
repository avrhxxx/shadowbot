// =====================================
// 📁 src/quickadd/storage/QuickAddRepository.ts
// =====================================

/**
 * 💾 ROLE:
 * Central persistence layer for QuickAdd (Google Sheets).
 *
 * Responsible for:
 * - session lifecycle storage
 * - learning data (OCR → parser)
 * - user corrections (adjusted)
 * - queueing points/events
 *
 * ❗ RULES:
 * - NO business logic
 * - NO validation
 * - ONLY data IO
 * - QuickAdd owns schema (NOT google layer)
 */

import {
  readSheet,
  writeSheet,
  updateCell,
} from "../../google/googleSheetsStorage";

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("REPOSITORY");

// =====================================
// 📌 CONFIG (TABS)
// =====================================

const SESSIONS_TAB = "quickadd_sessions";
const NICKNAME_TAB = "quickadd_nicknames";
const POINTS_QUEUE_TAB = "quickadd_points_queue";
const EVENTS_QUEUE_TAB = "quickadd_events_queue";

// =====================================
// 📌 HEADERS (SOURCE OF TRUTH)
// =====================================

const SESSION_HEADERS = [
  "sessionId",
  "sessionDisplayId",
  "guildId",
  "ownerId",
  "threadId",
  "type",
  "status",
  "createdAt",
  "endedAt",
];

const LEARNING_HEADERS = [
  "sessionId",
  "sessionDisplayId",
  "type",
  "ocr_raw",
  "layout_text",
  "parser_output",
  "adjusted",
  "override",
  "createdAt",
];

const POINTS_HEADERS = [
  "sessionId",
  "sessionDisplayId",
  "guildId",
  "category",
  "week",
  "nickname",
  "points",
  "status",
  "createdAt",
];

const EVENTS_HEADERS = [
  "sessionId",
  "sessionDisplayId",
  "guildId",
  "eventId",
  "type",
  "nickname",
  "status",
  "createdAt",
];

// =====================================
// 🧱 TYPES
// =====================================

type LearningRow = {
  sessionId: string;
  sessionDisplayId: string;
  type: string;
  ocr_raw: string;
  layout_text: string;
  parser_output: string;
};

type AdjustedEntry = {
  ocr_raw: string;
  adjusted: string;
};

type PointsQueueEntry = {
  sessionId: string;
  sessionDisplayId: string;
  guildId: string;
  category: string;
  week: string;
  nickname: string;
  points: number;
};

type EventsQueueEntry = {
  sessionId: string;
  sessionDisplayId: string;
  guildId: string;
  eventId: string;
  type: string;
  nickname: string;
};

// =====================================
// 🧠 INTERNAL HELPERS
// =====================================

async function ensureHeaders(tab: string, headers: string[]) {
  const sheet = await readSheet(tab);

  if (!sheet || sheet.length === 0) {
    await writeSheet(tab, [headers]);
  }
}

// =====================================
// 🧠 SESSION
// =====================================

export async function createSession(data: {
  sessionId: string;
  sessionDisplayId: string;
  guildId: string;
  ownerId: string;
  threadId: string;
  type: string;
  traceId: string;
}) {
  await ensureHeaders(SESSIONS_TAB, SESSION_HEADERS);

  const row = [
    data.sessionId,
    data.sessionDisplayId,
    data.guildId,
    data.ownerId,
    data.threadId,
    data.type,
    "ACTIVE",
    Date.now(),
    "",
  ];

  const existing = await readSheet(SESSIONS_TAB);
  await writeSheet(SESSIONS_TAB, [...existing, row]);

  log.trace("session_created", data.traceId, {
    sessionId: data.sessionId,
  });
}

export async function endSession(sessionId: string, traceId: string) {
  const sheet = await readSheet(SESSIONS_TAB);
  const headers = sheet[0];

  const idIndex = headers.indexOf("sessionId");
  const statusIndex = headers.indexOf("status");
  const endedIndex = headers.indexOf("endedAt");

  for (let i = 1; i < sheet.length; i++) {
    if (sheet[i][idIndex] === sessionId) {
      await updateCell(SESSIONS_TAB, i, statusIndex, "ENDED");
      await updateCell(SESSIONS_TAB, i, endedIndex, Date.now());
      break;
    }
  }

  log.trace("session_ended", traceId, { sessionId });
}

export async function markSessionError(sessionId: string, traceId: string) {
  const sheet = await readSheet(SESSIONS_TAB);
  const headers = sheet[0];

  const idIndex = headers.indexOf("sessionId");
  const statusIndex = headers.indexOf("status");
  const endedIndex = headers.indexOf("endedAt");

  for (let i = 1; i < sheet.length; i++) {
    if (sheet[i][idIndex] === sessionId) {
      await updateCell(SESSIONS_TAB, i, statusIndex, "ERROR");
      await updateCell(SESSIONS_TAB, i, endedIndex, Date.now());
      break;
    }
  }

  log.trace("session_error", traceId, { sessionId });
}

// =====================================
// 📊 LEARNING
// =====================================

export async function saveLearning(rows: LearningRow[], traceId: string) {
  if (!rows.length) return;

  await ensureHeaders(NICKNAME_TAB, LEARNING_HEADERS);

  const values = rows.map((r) => [
    r.sessionId,
    r.sessionDisplayId,
    r.type,
    r.ocr_raw,
    r.layout_text,
    r.parser_output,
    "",
    "",
    Date.now(),
  ]);

  const existing = await readSheet(NICKNAME_TAB);
  await writeSheet(NICKNAME_TAB, [...existing, ...values]);

  log.trace("learning_saved", traceId, { count: rows.length });
}

export async function saveAdjusted(entries: AdjustedEntry[], traceId: string) {
  if (!entries.length) return;

  const sheet = await readSheet(NICKNAME_TAB);
  const headers = sheet[0];

  const ocrIndex = headers.indexOf("ocr_raw");
  const adjustedIndex = headers.indexOf("adjusted");

  for (const entry of entries) {
    for (let i = 1; i < sheet.length; i++) {
      if (clean(sheet[i][ocrIndex]) === clean(entry.ocr_raw)) {
        await updateCell(NICKNAME_TAB, i, adjustedIndex, entry.adjusted);
        break;
      }
    }
  }

  log.trace("adjusted_saved", traceId, { count: entries.length });
}

// =====================================
// 📥 QUEUE
// =====================================

export async function enqueuePoints(entries: PointsQueueEntry[], traceId: string) {
  if (!entries.length) return;

  await ensureHeaders(POINTS_QUEUE_TAB, POINTS_HEADERS);

  const rows = entries.map((e) => [
    e.sessionId,
    e.sessionDisplayId,
    e.guildId,
    e.category,
    e.week,
    e.nickname,
    e.points,
    "PENDING",
    Date.now(),
  ]);

  const existing = await readSheet(POINTS_QUEUE_TAB);
  await writeSheet(POINTS_QUEUE_TAB, [...existing, ...rows]);

  log.trace("points_enqueued", traceId, { count: rows.length });
}

export async function enqueueEvents(entries: EventsQueueEntry[], traceId: string) {
  if (!entries.length) return;

  await ensureHeaders(EVENTS_QUEUE_TAB, EVENTS_HEADERS);

  const rows = entries.map((e) => [
    e.sessionId,
    e.sessionDisplayId,
    e.guildId,
    e.eventId,
    e.type,
    e.nickname,
    "PENDING",
    Date.now(),
  ]);

  const existing = await readSheet(EVENTS_QUEUE_TAB);
  await writeSheet(EVENTS_QUEUE_TAB, [...existing, ...rows]);

  log.trace("events_enqueued", traceId, { count: rows.length });
}

// =====================================
// 📖 READ
// =====================================

export async function getLearningData(traceId: string) {
  const data = await readSheet(NICKNAME_TAB);
  log.trace("learning_loaded", traceId, { rows: data.length });
  return data;
}

// =====================================
// 🔧 WORKER
// =====================================

export async function getQueue(tab: string) {
  return readSheet(tab);
}

export async function markProcessed(
  tab: string,
  rowIndex: number,
  statusCol: number,
  processedAtCol: number
) {
  await updateCell(tab, rowIndex, statusCol, "PROCESSED");
  await updateCell(tab, rowIndex, processedAtCol, Date.now());
}

// =====================================
// 🧼 CLEAN
// =====================================

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}