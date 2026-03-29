// =====================================
// 📁 src/system/quickadd/storage/QuickAddBuffer.ts
// =====================================

import { log } from "../../../core/logger/log";
import { EntryStatus } from "../core/QuickAddTypes";
import { TraceContext } from "../../../core/trace/TraceContext";

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

function cloneEntry(entry: BufferedEntry): BufferedEntry {
  return { ...entry };
}

function cloneEntries(entries: BufferedEntry[]): BufferedEntry[] {
  return entries.map(cloneEntry);
}

function checkTimeout(sessionId: string, ctx: TraceContext) {
  const l = log.ctx(ctx);

  const last = lastAccess.get(sessionId);
  const now = Date.now();

  if (last && now - last > TIMEOUT_MS) {
    const before = buffer.get(sessionId)?.length || 0;

    l.warn("buffer_timeout", {
      context: { sessionId },
      stats: { before },
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
    ctx: TraceContext
  ) {
    const l = log.ctx(ctx);

    checkTimeout(sessionId, ctx);

    l.event("buffer_add_start", {
      context: { sessionId },
      stats: { incoming: entries.length },
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

    l.event("buffer_add_done", {
      context: { sessionId },
      stats: { after: updated.length },
    });
  },

  replaceEntries(
    sessionId: string,
    entries: BufferedEntry[],
    ctx: TraceContext
  ) {
    const l = log.ctx(ctx);

    checkTimeout(sessionId, ctx);

    l.event("buffer_replace_start", {
      context: { sessionId },
      stats: {
        count: entries.length,
      },
    });

    const maxId =
      entries.length > 0
        ? Math.max(...entries.map((e) => e.id))
        : 0;

    buffer.set(sessionId, entries);
    idCounters.set(sessionId, maxId + 1);

    l.event("buffer_replace_done", {
      context: { sessionId },
      stats: {
        nextId: maxId + 1,
      },
    });
  },

  getEntries(
    sessionId: string,
    ctx: TraceContext
  ): BufferedEntry[] {
    const l = log.ctx(ctx);

    checkTimeout(sessionId, ctx);

    const entries = buffer.get(sessionId) || [];

    l.event("buffer_get", {
      context: { sessionId },
      stats: { count: entries.length },
    });

    return cloneEntries(entries);
  },

  clear(sessionId: string, ctx: TraceContext) {
    const l = log.ctx(ctx);

    l.event("buffer_clear", {
      context: { sessionId },
    });

    buffer.delete(sessionId);
    idCounters.delete(sessionId);
    lastAccess.delete(sessionId);
  },
};