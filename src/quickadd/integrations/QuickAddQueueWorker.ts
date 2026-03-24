// =====================================
// 📁 src/quickadd/integrations/QuickAddQueueWorker.ts
// =====================================

import { createLogger } from "../debug/DebugLogger"; // ✅ FIX
import { readSheet, updateCell } from "../../google/googleSheetsStorage"; // ✅ FIX

import { addParticipants } from "../../eventsPanel/eventService";
import { addPoints } from "../../pointsPanel/pointsService";

// ✅ FIX — scope zgodny z DebugLogger
const log = createLogger("INTEGRATION");

// --------------------------
// CONFIG
// --------------------------
const EVENTS_QUEUE_TAB = "quickadd_events_queue";
const POINTS_QUEUE_TAB = "quickadd_points_queue";

const INTERVAL_MS = 5000; // co 5 sekund

// --------------------------
// TYPES
// --------------------------
type EventQueueRow = {
  rowIndex: number;
  guildId: string;
  eventId: string;
  type: string;
  nickname: string;
  status: string;
};

type PointsQueueRow = {
  rowIndex: number;
  guildId: string;
  category: string;
  week: string;
  nickname: string;
  points: string;
  status: string;
};

// --------------------------
// START WORKER
// --------------------------
export function startQuickAddWorker() {
  log("worker_started");

  setInterval(async () => {
    try {
      await processEventsQueue();
      await processPointsQueue();
    } catch (err) {
      log.warn("worker_loop_error", err);
    }
  }, INTERVAL_MS);
}

// --------------------------
// EVENTS QUEUE
// --------------------------
async function processEventsQueue() {
  const rows = await readSheet(EVENTS_QUEUE_TAB);
  if (!rows || rows.length < 2) return;

  const headers = rows[0];

  const getIndex = (name: string) => headers.indexOf(name);

  const idxGuild = getIndex("guildId");
  const idxEvent = getIndex("eventId");
  const idxType = getIndex("type");
  const idxNick = getIndex("nickname");
  const idxStatus = getIndex("status");
  const idxProcessedAt = getIndex("processedAt");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const status = row[idxStatus];
    if (status !== "PENDING") continue;

    const entry: EventQueueRow = {
      rowIndex: i + 1,
      guildId: row[idxGuild],
      eventId: row[idxEvent],
      type: row[idxType],
      nickname: row[idxNick],
      status,
    };

    try {
      if (entry.type === "RR_SIGNUPS") {
        await addParticipants(entry.guildId, entry.eventId, [
          entry.nickname,
        ]);
      }

      if (entry.type === "RR_RESULTS") {
        await addParticipants(entry.guildId, entry.eventId, [
          entry.nickname,
        ]);
      }

      await updateCell(EVENTS_QUEUE_TAB, entry.rowIndex, idxStatus + 1, "PROCESSED");
      await updateCell(EVENTS_QUEUE_TAB, entry.rowIndex, idxProcessedAt + 1, Date.now());

      log("event_processed", entry);
    } catch (err) {
      log.warn("event_process_failed", {
        entry,
        err,
      });
    }
  }
}

// --------------------------
// POINTS QUEUE
// --------------------------
async function processPointsQueue() {
  const rows = await readSheet(POINTS_QUEUE_TAB);
  if (!rows || rows.length < 2) return;

  const headers = rows[0];

  const getIndex = (name: string) => headers.indexOf(name);

  const idxCategory = getIndex("category");
  const idxWeek = getIndex("week");
  const idxNick = getIndex("nickname");
  const idxPoints = getIndex("points");
  const idxStatus = getIndex("status");
  const idxProcessedAt = getIndex("processedAt");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const status = row[idxStatus];
    if (status !== "PENDING") continue;

    const entry: PointsQueueRow = {
      rowIndex: i + 1,
      guildId: "",
      category: row[idxCategory],
      week: row[idxWeek],
      nickname: row[idxNick],
      points: row[idxPoints],
      status,
    };

    try {
      await addPoints({
        category: entry.category as any,
        week: entry.week,
        nick: entry.nickname,
        points: entry.points,
      });

      await updateCell(POINTS_QUEUE_TAB, entry.rowIndex, idxStatus + 1, "PROCESSED");
      await updateCell(POINTS_QUEUE_TAB, entry.rowIndex, idxProcessedAt + 1, Date.now());

      log("points_processed", entry);
    } catch (err) {
      log.warn("points_process_failed", {
        entry,
        err,
      });
    }
  }
}