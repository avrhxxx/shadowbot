// =====================================
// 📁 src/quickadd/storage/QuickAddBuffer.ts
// =====================================

import { log } from "../logger";
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
// 🧠 INTERNAL STATE
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

function checkTimeout(guildId: string, traceId: string) {
  const last = lastAccess.get(guildId);
  const now = Date.now();

  if (last && now - last > TIMEOUT_MS) {
    const before = buffer.get(guildId)?.length || 0;

    log.emit({
      event: "buffer_timeout",
      traceId,
      data: { guildId, before },
      level: "warn",
    });

    buffer.delete(guildId);
    idCounters.delete(guildId);
    lastAccess.delete(guildId);
  }

  lastAccess.set(guildId, now);
}

// =====================================
// 🚀 API
// =====================================

export const QuickAddBuffer = {
  addEntries(guildId: string, entries: ParsedEntry[], traceId: string) {
    assertTrace(traceId, "addEntries");
    checkTimeout(guildId, traceId);

    log.emit({
      event: "buffer_add_start",
      traceId,
      data: { guildId, incoming: entries.length },
    });

    const current = buffer.get(guildId) || [];
    let nextId = idCounters.get(guildId) || 1;

    const newEntries: BufferedEntry[] = entries.map((e) => ({
      id: nextId++,
      ...e,
    }));

    const updated = [...current, ...newEntries];

    buffer.set(guildId, updated);
    idCounters.set(guildId, nextId);

    log.emit({
      event: "buffer_add_done",
      traceId,
      data: { guildId, after: updated.length },
    });
  },

  getEntries(guildId: string, traceId: string): BufferedEntry[] {
    assertTrace(traceId, "getEntries");
    checkTimeout(guildId, traceId);

    const entries = buffer.get(guildId) || [];

    log.emit({
      event: "buffer_get",
      traceId,
      data: { guildId, count: entries.length },
    });

    return cloneEntries(entries);
  },

  clear(guildId: string, traceId: string) {
    assertTrace(traceId, "clear");

    log.emit({
      event: "buffer_clear",
      traceId,
      data: { guildId },
    });

    buffer.delete(guildId);
    idCounters.delete(guildId);
    lastAccess.delete(guildId);
  },
};