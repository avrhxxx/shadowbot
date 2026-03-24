// =====================================
// 📁 src/quickadd/storage/QuickAddService.ts
// =====================================

import {
  readSheet,
  updateCell,
  writeSheet,
} from "../../google/googleSheetsStorage";

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("QA_SERVICE");

// =====================================
// 📌 CONFIG
// =====================================
const NICKNAME_TAB = "quickadd_nicknames";
const QUEUE_TAB = "quickadd_points_queue";

// =====================================
// TYPES (UPDATED)
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

type QueueEntry = {
  guildId: string;
  type: string;
  nickname: string;
  value: number;
};

// =====================================
// 📊 LEARNING (OCR → LAYOUT → PARSER)
// =====================================
export async function saveLearning(rows: LearningRow[]) {
  if (!rows.length) return;

  try {
    const existing = await readSheet(NICKNAME_TAB);

    const values = rows.map((r) => [
      r.type,
      r.ocr_raw,
      r.layout_text,
      r.parser_output,
      "", // adjusted
      "", // override
      Date.now(),
    ]);

    const newData = [...existing, ...values];

    await writeSheet(NICKNAME_TAB, newData);

    log("learning_saved", {
      count: rows.length,
    });
  } catch (err) {
    log.warn("learning_failed", err);
  }
}

// =====================================
// ✏️ ADJUSTED (USER CORRECTION)
// =====================================
export async function saveAdjusted(entries: AdjustedEntry[]) {
  if (!entries.length) return;

  try {
    const sheet = await readSheet(NICKNAME_TAB);
    const headers = sheet[0];

    const ocrIndex = headers.indexOf("ocr_raw");
    const adjustedIndex = headers.indexOf("adjusted");

    if (ocrIndex === -1 || adjustedIndex === -1) {
      log.warn("missing_columns_adjusted");
      return;
    }

    for (const entry of entries) {
      const cleaned = clean(entry.ocr_raw);

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const ocrRaw = row[ocrIndex];

        if (!ocrRaw) continue;

        if (clean(ocrRaw) === cleaned) {
          await updateCell(NICKNAME_TAB, i, adjustedIndex, entry.adjusted);

          log("adjusted_applied", {
            ocr: ocrRaw,
            adjusted: entry.adjusted,
          });

          break;
        }
      }
    }

  } catch (err) {
    log.warn("adjusted_failed", err);
  }
}

// =====================================
// 📥 QUEUE (CONFIRM → SHEETS)
// =====================================
export async function enqueue(entries: QueueEntry[]) {
  if (!entries.length) return;

  try {
    const existing = await readSheet(QUEUE_TAB);

    const rows = entries.map((e) => [
      e.guildId,
      e.type,
      e.nickname,
      e.value,
      "PENDING",
      Date.now(),
    ]);

    const newData = [...existing, ...rows];

    await writeSheet(QUEUE_TAB, newData);

    log("queue_saved", {
      count: rows.length,
    });
  } catch (err) {
    log.error("queue_failed", err);
    throw err;
  }
}

// =====================================
// 📖 READ LEARNING DATA
// =====================================
export async function getLearningData(): Promise<any[][]> {
  try {
    const data = await readSheet(NICKNAME_TAB);

    log("learning_loaded", {
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
// 🧼 CLEAN
// =====================================
function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}