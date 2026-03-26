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
 * - traceId REQUIRED
 * - sliding timeout
 */

import { createLogger } from "../debug/DebugLogger";
import { EntryStatus } from "../validation/QuickAddValidator";

const log = createLogger("BUFFER");

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

function checkTimeout(guildId: string, traceId: string) {
  const last = lastAccess.get(guildId);
  const now = Date.now();

  if (last && now - last > TIMEOUT_MS) {
    log.trace("buffer_timeout", traceId, { guildId });
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
    traceId: string // 🔥 REQUIRED
  ) {
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

    // 🔥 IMMUTABLE UPDATE
    const updated = [...current, ...newEntries];

    buffer.set(guildId, updated);
    idCounters.set(guildId, nextId);

    log.trace("buffer_updated", traceId, {
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
    checkTimeout(guildId, traceId);

    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_replace_start", traceId, {
      guildId,
      before,
      incoming: entries.length,
    });

    const cloned = entries.map((e) => ({ ...e }));

    buffer.set(guildId, cloned);

    const maxId = cloned.reduce(
      (max, e) => (e.id > max ? e.id : max),
      0
    );

    idCounters.set(guildId, maxId + 1);

    log.trace("buffer_replaced", traceId, {
      guildId,
      before,
      after: cloned.length,
      nextId: maxId + 1,
    });
  },

  getEntries(guildId: string, traceId: string): BufferedEntry[] {
    checkTimeout(guildId, traceId);

    const entries = buffer.get(guildId) || [];

    log.trace("buffer_get", traceId, {
      guildId,
      count: entries.length,
    });

    return entries.map((e) => ({ ...e }));
  },

  clear(guildId: string, traceId: string) {
    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_clear", traceId, {
      guildId,
      before,
    });

    buffer.delete(guildId);
    idCounters.delete(guildId);
    lastAccess.delete(guildId);
  },
};