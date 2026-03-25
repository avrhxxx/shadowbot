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
 */

import { createLogger } from "../debug/DebugLogger";

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

  status?: string;
  confidence?: number;
  suggestion?: string;

  source?: string;
};

// =====================================
// 🧠 INTERNAL STATE
// =====================================

const buffer = new Map<string, BufferedEntry[]>();
const idCounters = new Map<string, number>();

// =====================================
// 🚀 PUBLIC API
// =====================================

export const QuickAddBuffer = {
  addEntries(
    guildId: string,
    entries: (ParsedEntry & {
      status?: string;
      confidence?: number;
      suggestion?: string;
      source?: string;
    })[]
  ) {
    log.trace("buffer_add_start", {
      guildId,
      incoming: entries.length,
    });

    if (!buffer.has(guildId)) {
      buffer.set(guildId, []);
      log.trace("buffer_created", { guildId });
    }

    if (!idCounters.has(guildId)) {
      idCounters.set(guildId, 1);
      log.trace("id_counter_initialized", { guildId });
    }

    const current = buffer.get(guildId)!;
    const beforeCount = current.length;

    let currentId = idCounters.get(guildId)!;

    for (const entry of entries) {
      // 🔥 defensive copy (input safety)
      const safeEntry = { ...entry };

      log.trace("buffer_entry_in", {
        nickname: safeEntry.nickname,
        value: safeEntry.value,
        status: safeEntry.status,
        confidence: safeEntry.confidence,
      });

      current.push({
        id: currentId++,
        nickname: safeEntry.nickname,
        value: safeEntry.value,

        status: safeEntry.status,
        confidence: safeEntry.confidence,
        suggestion: safeEntry.suggestion,

        source: safeEntry.source,
      });
    }

    idCounters.set(guildId, currentId);

    log.trace("buffer_updated", {
      guildId,
      before: beforeCount,
      added: entries.length,
      after: current.length,
    });
  },

  setEntries(
    guildId: string,
    entries: BufferedEntry[]
  ) {
    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_replace_start", {
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

    log.trace("buffer_replaced", {
      guildId,
      before,
      after: cloned.length,
      nextId: maxId + 1,
    });
  },

  getEntries(guildId: string): BufferedEntry[] {
    const entries = buffer.get(guildId) || [];

    log.trace("buffer_get", {
      guildId,
      count: entries.length,
    });

    // 🔥 CRITICAL FIX — return copy
    return entries.map((e) => ({ ...e }));
  },

  clear(guildId: string) {
    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_clear", {
      guildId,
      before,
    });

    buffer.delete(guildId);
    idCounters.delete(guildId);
  },
};