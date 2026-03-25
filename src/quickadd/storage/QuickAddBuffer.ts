// =====================================
// 📁 src/quickadd/storage/QuickAddBuffer.ts
// =====================================

/**
 * 🧠 ROLE:
 * In-memory state for QuickAdd session entries.
 *
 * Responsible for:
 * - storing validated entries per guild
 * - assigning stable IDs
 * - enabling preview / adjust / confirm flow
 *
 * ❗ RULES:
 * - NO persistence (this is NOT database)
 * - NO business logic
 * - pure state container
 */

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("BUFFER");

type ParsedEntry = {
  nickname: string;
  value: number;

  // 🔥 debug / tracing
  source?: string;
};

type BufferedEntry = {
  id: number;

  nickname: string;
  value: number;

  // 🔥 validation
  status?: string;
  confidence?: number;
  suggestion?: string;

  // 🔥 debug
  source?: string;
};

// =====================================
// 🧠 INTERNAL STATE
// =====================================

const buffer = new Map<string, BufferedEntry[]>();

// 🔥 ID counter per guild (stable IDs for UI)
const idCounters = new Map<string, number>();

// =====================================
// 🚀 PUBLIC API
// =====================================

export const QuickAddBuffer = {
  // =============================
  // ➕ ADD ENTRIES
  // =============================
  addEntries(
    guildId: string,
    entries: (ParsedEntry & {
      status?: string;
      confidence?: number;
      suggestion?: string;
      source?: string;
    })[]
  ) {
    // =====================================
    // 📥 INPUT
    // =====================================
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

    // =====================================
    // ➕ ADD LOOP
    // =====================================
    for (const entry of entries) {
      log.trace("buffer_entry_in", {
        nickname: entry.nickname,
        value: entry.value,
        status: entry.status,
        confidence: entry.confidence,
      });

      current.push({
        id: currentId++,
        nickname: entry.nickname,
        value: entry.value,

        // validation
        status: entry.status,
        confidence: entry.confidence,
        suggestion: entry.suggestion,

        // debug
        source: entry.source,
      });
    }

    idCounters.set(guildId, currentId);

    // =====================================
    // 📊 STATE DIFF
    // =====================================
    log.trace("buffer_updated", {
      guildId,
      before: beforeCount,
      added: entries.length,
      after: current.length,
    });
  },

  // =============================
  // 🔁 SET ENTRIES (REPLACE)
  // =============================
  setEntries(
    guildId: string,
    entries: BufferedEntry[]
  ) {
    // =====================================
    // 📥 INPUT
    // =====================================
    const before = buffer.get(guildId)?.length || 0;

    log.trace("buffer_replace_start", {
      guildId,
      before,
      incoming: entries.length,
    });

    // 🔥 immutability guard
    const cloned = entries.map((e) => ({ ...e }));

    buffer.set(guildId, cloned);

    // 🔥 keep ID counter consistent
    const maxId = cloned.reduce(
      (max, e) => (e.id > max ? e.id : max),
      0
    );

    idCounters.set(guildId, maxId + 1);

    // =====================================
    // 📊 STATE DIFF
    // =====================================
    log.trace("buffer_replaced", {
      guildId,
      before,
      after: cloned.length,
      nextId: maxId + 1,
    });
  },

  // =============================
  // 📥 GET ENTRIES
  // =============================
  getEntries(guildId: string): BufferedEntry[] {
    const entries = buffer.get(guildId) || [];

    log.trace("buffer_get", {
      guildId,
      count: entries.length,
    });

    return entries;
  },

  // =============================
  // 🧹 CLEAR
  // =============================
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