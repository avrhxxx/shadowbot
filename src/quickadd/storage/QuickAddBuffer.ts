// =====================================
// 📁 src/quickadd/storage/QuickAddBuffer.ts
// =====================================

/**
 * 🧠 ROLE:
 * In-memory state for QuickAdd session entries.
 *
 * ❗ RULES:
 * - IMMUTABLE OUTSIDE
 * - state can ONLY be modified via API
 * - traceId REQUIRED (STRICT)
 * - sliding timeout
 * - returns SAFE COPIES ONLY
 */

import { createScopedLogger } from "@/quickadd/debug/logger";
import { EntryStatus } from "../validation/QuickAddValidator";

const log = createScopedLogger(import.meta.url);

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
// 🧠 INTERNAL HELPERS
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

    log.trace("buffer_timeout", traceId, {
      guildId,
      before,
    });

    buffer.delete(guildId);
    idCounters.delete(guildId);
    lastAccess.delete(guildId);
  }

  lastAccess.set(guildId, now);
}

// =====================================
// 🚀 PUBLIC API
// =====================================

export const QuickAddBuffer = {
  addEntries(
    guildId: string,
    entries: (ParsedEntry & {
      status?: EntryStatus;
      confidence?: number;
      suggestion?: string;
      source?: string;
    })[],
    traceId: string
  ) {
    assertTrace(traceId, "addEntries");
    checkTimeout(guildId, traceId);

    log.trace("buffer_add_start", traceId, {
      guildId,
      incoming: entries.length,
    });

    const current = buffer.get(guildId) || [];
    const beforeCount = current.length;

    const currentId = idCounters.get(guildId) || 1;
    let nextId = currentId;

    const newEntries: BufferedEntry[] = entries.map((entry) => ({
      id: nextId++,
      nickname: entry.nickname,
      value: entry.value,
      status: entry.status,
      confidence: entry.confidence,
      suggestion: entry.suggestion,
      source: entry.source,
    }));

    const updated = [...current, ...newEntries];

    buffer.set(guildId, updated);
    idCounters.set(guildId, nextId);

    log.trace("buffer_add_done", traceId, {
      guildId,
      before: beforeCount,
      added: entries.length,
      after: updated.length,
    });
  },

  setEntries(
    guildId: string,
    entries: BufferedEntry[],
    traceId: string
  ) {
    assertTrace(traceId, "setEntries");
    checkTimeout(guildId, traceId);

    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_replace_start", traceId, {
      guildId,
      before,
      incoming: entries.length,
    });

    const cloned = cloneEntries(entries);

    buffer.set(guildId, cloned);

    const maxId = cloned.reduce(
      (max, e) => (e.id > max ? e.id : max),
      0
    );

    idCounters.set(guildId, maxId + 1);

    log.trace("buffer_replace_done", traceId, {
      guildId,
      before,
      after: cloned.length,
      nextId: maxId + 1,
    });
  },

  getEntries(guildId: string, traceId: string): BufferedEntry[] {
    assertTrace(traceId, "getEntries");
    checkTimeout(guildId, traceId);

    const entries = buffer.get(guildId) || [];

    log.trace("buffer_get", traceId, {
      guildId,
      count: entries.length,
    });

    return cloneEntries(entries);
  },

  clear(guildId: string, traceId: string) {
    assertTrace(traceId, "clear");

    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_clear_start", traceId, {
      guildId,
      before,
    });

    buffer.delete(guildId);
    idCounters.delete(guildId);
    lastAccess.delete(guildId);

    log.trace("buffer_clear_done", traceId, {
      guildId,
    });
  },
};