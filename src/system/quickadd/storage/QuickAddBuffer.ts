// =====================================
// 📁 src/system/quickadd/storage/QuickAddBuffer.ts
// =====================================

import { logger } from "../../../core/logger/log";
import { EntryStatus } from "../core/QuickAddTypes";

type ParsedEntry = {
  nickname: string;
  value: number;
  source?: string;
};

type BufferedEntry = {
  id: number;

  nickname: string;
  value: number;

  status?: EntryStatus;
  confidence?: number;
  suggestion?: string;

  source?: string;
};

// =====================================
// 🧠 INTERNAL STATE (🔥 sessionId-based)
// =====================================

const buffer = new Map<string, BufferedEntry[]>();
const idCounters = new Map<string, number>();
const lastAccess = new Map<string, number>();

const TIMEOUT_MS = 5 * 60 * 1000;

// =====================================
// 🧠 HELPERS
// =====================================

function assertTrace(traceId: string, scope: string) {
  if (!traceId) {
    throw new Error(`[BUFFER ERROR] Missing traceId in ${scope}`);
  }
}

function cloneEntry(entry: BufferedEntry): BufferedEntry {
  return { ...entry };
}

function cloneEntries(entries: BufferedEntry[]): BufferedEntry[] {
  return entries.map(cloneEntry);
}

function checkTimeout(sessionId: string, traceId: string) {
  const last = lastAccess.get(sessionId);
  const now = Date.now();

  if (last && now - last > TIMEOUT_MS) {
    const before = buffer.get(sessionId)?.length || 0;

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_timeout",
      traceId,
      level: "warn",
      context: { sessionId, before },
    });

    buffer.delete(sessionId);
    idCounters.delete(sessionId);
    lastAccess.delete(sessionId);
  }

  lastAccess.set(sessionId, now);
}

// =====================================
// 🚀 API
// =====================================

export const QuickAddBuffer = {
  addEntries(
    sessionId: string,
    entries: ParsedEntry[],
    traceId: string
  ) {
    assertTrace(traceId, "addEntries");
    checkTimeout(sessionId, traceId);

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_add_start",
      traceId,
      context: { sessionId, incoming: entries.length },
    });

    const current = buffer.get(sessionId) || [];
    let nextId = idCounters.get(sessionId) || 1;

    const newEntries: BufferedEntry[] = entries.map((e) => ({
      id: nextId++,
      ...e,
    }));

    const updated = [...current, ...newEntries];

    buffer.set(sessionId, updated);
    idCounters.set(sessionId, nextId);

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_add_done",
      traceId,
      context: { sessionId, after: updated.length },
    });
  },

  replaceEntries(
    sessionId: string,
    entries: BufferedEntry[],
    traceId: string
  ) {
    assertTrace(traceId, "replaceEntries");
    checkTimeout(sessionId, traceId);

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_replace_start",
      traceId,
      context: {
        sessionId,
        count: entries.length,
      },
    });

    const maxId =
      entries.length > 0
        ? Math.max(...entries.map((e) => e.id))
        : 0;

    buffer.set(sessionId, entries);
    idCounters.set(sessionId, maxId + 1);

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_replace_done",
      traceId,
      context: {
        sessionId,
        nextId: maxId + 1,
      },
    });
  },

  getEntries(
    sessionId: string,
    traceId: string
  ): BufferedEntry[] {
    assertTrace(traceId, "getEntries");
    checkTimeout(sessionId, traceId);

    const entries = buffer.get(sessionId) || [];

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_get",
      traceId,
      context: { sessionId, count: entries.length },
    });

    return cloneEntries(entries);
  },

  clear(sessionId: string, traceId: string) {
    assertTrace(traceId, "clear");

    logger.emit({
      scope: "quickadd.buffer",
      event: "buffer_clear",
      traceId,
      context: { sessionId },
    });

    buffer.delete(sessionId);
    idCounters.delete(sessionId);
    lastAccess.delete(sessionId);
  },
};