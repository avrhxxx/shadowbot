// =====================================
// 📁 src/quickadd/storage/QuickAddService.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";

// 🔥 LOW LEVEL STORAGE (ONLY HERE)
import {
  appendQuickAddAdjusted,
  readSheet,
  updateCell,
} from "../../googleSheetsStorage";

const log = createLogger("QA_SERVICE");

// =====================================
// TYPES
// =====================================
type QueueEntry = {
  guildId: string;
  type: string;
  nickname: string;
  value?: number;
};

type AdjustedEntry = {
  type: string;
  nickname: string;
};

// =====================================
// 🔥 ADJUSTED (LEARNING)
// =====================================
export async function saveAdjusted(entries: AdjustedEntry[]) {
  if (!entries.length) return;

  try {
    await appendQuickAddAdjusted(entries);

    log("adjusted_saved", {
      count: entries.length,
    });
  } catch (err) {
    log.warn("adjusted_save_failed", err);
  }
}

// =====================================
// 🔥 EVENTS QUEUE (READ)
// =====================================
export async function getEventsQueue() {
  try {
    const rows = await readSheet("quickadd_events_queue");

    if (!rows || rows.length < 2) return [];

    const headers = rows[0];

    const idx = (name: string) => headers.indexOf(name);

    return rows.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      guildId: row[idx("guildId")],
      eventId: row[idx("eventId")],
      type: row[idx("type")],
      nickname: row[idx("nickname")],
      status: row[idx("status")],
    }));
  } catch (err) {
    log.warn("events_queue_read_failed", err);
    return [];
  }
}

// =====================================
// 🔥 POINTS QUEUE (READ)
// =====================================
export async function getPointsQueue() {
  try {
    const rows = await readSheet("quickadd_points_queue");

    if (!rows || rows.length < 2) return [];

    const headers = rows[0];

    const idx = (name: string) => headers.indexOf(name);

    return rows.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      category: row[idx("category")],
      week: row[idx("week")],
      nickname: row[idx("nickname")],
      points: row[idx("points")],
      status: row[idx("status")],
    }));
  } catch (err) {
    log.warn("points_queue_read_failed", err);
    return [];
  }
}

// =====================================
// 🔥 MARK PROCESSED
// =====================================
export async function markProcessed(
  tab: string,
  rowIndex: number,
  statusCol: number,
  processedAtCol: number
) {
  try {
    await updateCell(tab, rowIndex, statusCol, "PROCESSED");
    await updateCell(tab, rowIndex, processedAtCol, Date.now());

    log("row_marked_processed", {
      tab,
      rowIndex,
    });
  } catch (err) {
    log.warn("mark_processed_failed", err);
  }
}