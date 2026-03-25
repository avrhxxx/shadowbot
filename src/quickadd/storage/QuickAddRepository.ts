// =====================================
// 📁 src/quickadd/storage/QuickAddRepository.ts
// =====================================

/**
 * 💾 ROLE:
 * Persistence layer for QuickAdd (Google Sheets).
 *
 * Responsible for:
 * - reading/writing learning data
 * - saving user corrections (adjusted)
 * - enqueueing points/events
 *
 * ❗ RULES:
 * - NO business logic
 * - NO validation
 * - just data IO
 *
 * Acts as:
 * QuickAdd → Repository → GoogleSheetsAdapter
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

const NICKNAME_TAB = "quickadd_nicknames";
const POINTS_QUEUE_TAB = "quickadd_points_queue";
const EVENTS_QUEUE_TAB = "quickadd_events_queue";

// =====================================
// 🧱 TYPES
// =====================================

type LearningRow = {
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
  guildId: string;
  category: string;
  week: string;
  nickname: string;
  points: number;
};

type EventsQueueEntry = {
  guildId: string;
  eventId: string;
  type: string;
  nickname: string;
};

// =====================================
// 📊 SAVE LEARNING (OCR → PARSER FLOW)
// =====================================

export async function saveLearning(rows: LearningRow[]) {
  if (!rows.length) return;

  try {
    let sheet = await readSheet(NICKNAME_TAB);

    if (!sheet || sheet.length === 0) {
      sheet = [[
        "type",
        "ocr_raw",
        "layout_text",
        "parser_output",
        "adjusted",
        "override",
        "createdAt",
      ]];
    }

    const values = rows.map((r) => [
      r.type,
      r.ocr_raw,
      r.layout_text,
      r.parser_output,
      "",
      "",
      Date.now(),
    ]);

    const newData = [...sheet, ...values];

    await writeSheet(NICKNAME_TAB, newData);

    // ✅ FIX — trace requires traceId
    log.trace("learning_saved", "repository", {
      count: rows.length,
    });

  } catch (err) {
    log.warn("learning_failed", err);
  }
}

// =====================================
// ✏️ SAVE ADJUSTED (USER CORRECTIONS)
// =====================================

export async function saveAdjusted(entries: AdjustedEntry[]) {
  if (!entries.length) return;

  try {
    let sheet = await readSheet(NICKNAME_TAB);

    if (!sheet || sheet.length === 0) {
      sheet = [[
        "type",
        "ocr_raw",
        "layout_text",
        "parser_output",
        "adjusted",
        "override",
        "createdAt",
      ]];
    }

    const headers = sheet[0];

    const ocrIndex = headers.indexOf("ocr_raw");
    const adjustedIndex = headers.indexOf("adjusted");

    if (ocrIndex === -1 || adjustedIndex === -1) {
      log.warn("missing_columns_adjusted");
      return;
    }

    for (const entry of entries) {
      let updated = false;

      const cleaned = clean(entry.ocr_raw);

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const ocrRaw = row[ocrIndex];

        if (!ocrRaw) continue;

        if (clean(ocrRaw) === cleaned) {
          await updateCell(NICKNAME_TAB, i, adjustedIndex, entry.adjusted);

          log.trace("adjusted_updated", "repository", {
            ocr: ocrRaw,
            adjusted: entry.adjusted,
          });

          updated = true;
          break;
        }
      }

      if (!updated) {
        const newRow = [
          "",
          entry.ocr_raw,
          "",
          "",
          entry.adjusted,
          "",
          Date.now(),
        ];

        sheet.push(newRow);

        log.trace("adjusted_added", "repository", {
          ocr: entry.ocr_raw,
          adjusted: entry.adjusted,
        });
      }
    }

    await writeSheet(NICKNAME_TAB, sheet);

  } catch (err) {
    log.warn("adjusted_failed", err);
  }
}

// =====================================
// 📥 QUEUE — POINTS
// =====================================

export async function enqueuePoints(entries: PointsQueueEntry[]) {
  if (!entries.length) return;

  try {
    const existing = await readSheet(POINTS_QUEUE_TAB);

    const rows = entries.map((e) => [
      e.guildId,
      e.category,
      e.week,
      e.nickname,
      e.points,
      "PENDING",
      Date.now(),
    ]);

    const newData = [...existing, ...rows];

    await writeSheet(POINTS_QUEUE_TAB, newData);

    log.trace("points_enqueued", "repository", {
      count: rows.length,
    });

  } catch (err) {
    log.error("points_queue_failed", err);
    throw err;
  }
}

// =====================================
// 📥 QUEUE — EVENTS
// =====================================

export async function enqueueEvents(entries: EventsQueueEntry[]) {
  if (!entries.length) return;

  try {
    const existing = await readSheet(EVENTS_QUEUE_TAB);

    const rows = entries.map((e) => [
      e.guildId,
      e.eventId,
      e.type,
      e.nickname,
      "PENDING",
      Date.now(),
    ]);

    const newData = [...existing, ...rows];

    await writeSheet(EVENTS_QUEUE_TAB, newData);

    log.trace("events_enqueued", "repository", {
      count: rows.length,
    });

  } catch (err) {
    log.error("events_queue_failed", err);
    throw err;
  }
}

// =====================================
// 📖 READ LEARNING DATA
// =====================================

export async function getLearningData(): Promise<any[][]> {
  try {
    const data = await readSheet(NICKNAME_TAB);

    log.trace("learning_loaded", "repository", {
      rows: data.length,
    });

    return data;
  } catch (err) {
    log.error("learning_load_failed", err);
    return [];
  }
}

// =====================================
// 🔧 WORKER HELPERS
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
// 🧼 CLEAN (ONLY FOR MATCHING)
// =====================================

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

/**
 * =====================================
 * ✅ CHANGES (INDEX)
 * =====================================
 *
 * 1. 🔥 FIXED ALL log.trace CALLS
 *    BEFORE:
 *      log.trace("event", { data })
 *
 *    AFTER:
 *      log.trace("event", "repository", { data })
 *
 *    ✔ Added required traceId argument
 *
 * 2. 🧠 TRACE STRATEGY
 *    - repository layer uses static traceId: "repository"
 *    - no session context here → correct architectural choice
 *
 * 3. ❗ NO OTHER LOGIC CHANGES
 *    - purely logging contract fix
 *
 * ✔ File now fully compatible with DebugLogger
 * ✔ Removes 6+ TS errors
 */