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
    if (!buffer.has(guildId)) {
      buffer.set(guildId, []);
    }

    if (!idCounters.has(guildId)) {
      idCounters.set(guildId, 1);
    }

    const current = buffer.get(guildId)!;
    let currentId = idCounters.get(guildId)!;

    for (const entry of entries) {
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
  },

  // =============================
  // 🔁 SET ENTRIES (REPLACE)
  // =============================
  setEntries(
    guildId: string,
    entries: BufferedEntry[]
  ) {
    // 🔥 immutability guard
    const cloned = entries.map((e) => ({ ...e }));

    buffer.set(guildId, cloned);

    // 🔥 keep ID counter consistent
    const maxId = cloned.reduce(
      (max, e) => (e.id > max ? e.id : max),
      0
    );

    idCounters.set(guildId, maxId + 1);
  },

  // =============================
  // 📥 GET ENTRIES
  // =============================
  getEntries(guildId: string): BufferedEntry[] {
    return buffer.get(guildId) || [];
  },

  // =============================
  // 🧹 CLEAR
  // =============================
  clear(guildId: string) {
    buffer.delete(guildId);
    idCounters.delete(guildId);
  },
};