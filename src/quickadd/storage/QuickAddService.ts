// =====================================
// 📁 src/quickadd/storage/QuickAddService.ts
// =====================================

import {
  appendQuickAddRows,
  appendQuickAddAdjusted,
  readSheet,
  writeSheet, // ✅ FIX: normal import
  updateCell,
} from "../../googleSheetsStorage";

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("QA_SERVICE");

// =====================================
// TYPES
// =====================================
type LearningRow = {
  type: string;
  ocr: string;
  final: string;
};

type AdjustedEntry = {
  type: string;
  nickname: string;
};

type QueueEntry = {
  guildId: string;
  type: string;
  nickname: string;
  value: number;
};

// =====================================
// 📊 LEARNING (RAW OCR → SHEET)
// =====================================
export async function saveLearning(rows: LearningRow[]) {
  if (!rows.length) return;

  try {
    await appendQuickAddRows(rows);

    log("learning_saved", {
      count: rows.length,
    });
  } catch (err) {
    log.warn("learning_failed", err);
  }
}

// =====================================
// ✏️ ADJUSTED (NICKNAME LEARNING)
// =====================================
export async function saveAdjusted(entries: AdjustedEntry[]) {
  if (!entries.length) return;

  try {
    await appendQuickAddAdjusted(entries);

    log("adjusted_saved", {
      count: entries.length,
    });
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
    const rows = entries.map((e) => [
      e.guildId,
      e.type,
      e.nickname,
      e.value,
      "PENDING",
      Date.now(),
    ]);

    await appendToQueue(rows);

    log("queue_saved", {
      count: rows.length,
    });
  } catch (err) {
    log.error("queue_failed", err);
    throw err;
  }
}

// =====================================
// 🔧 INTERNAL QUEUE APPEND
// =====================================
async function appendToQueue(values: any[][]) {
  const tab = "quickadd_points_queue"; // 🔥 MVP (points only)

  const existing = await readSheet(tab);

  const newData = [...existing, ...values];

  // ✅ FIX: no dynamic import
  await writeSheet(tab, newData);
}

// =====================================
// 📤 WORKER HELPERS (OPTIONAL)
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