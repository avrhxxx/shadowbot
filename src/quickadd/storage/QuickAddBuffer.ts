// =====================================
// 📁 src/quickadd/storage/QuickAddBuffer.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;

  // 🔥 NEW (debug propagation)
  source?: string;
};

type BufferedEntry = {
  id: number;
  nickname: string;
  value: number;

  // 🔥 NEW — VALIDATION (optional, backward compatible)
  status?: string;
  confidence?: number;
  suggestion?: string;

  // 🔥 NEW — SOURCE DEBUG
  source?: string;
};

const buffer = new Map<string, BufferedEntry[]>();

// 🔥 ID COUNTER PER GUILD
const idCounters = new Map<string, number>();

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

        // 🔥 VALIDATION
        status: entry.status,
        confidence: entry.confidence,
        suggestion: entry.suggestion,

        // 🔥 SOURCE DEBUG
        source: entry.source,
      });
    }

    idCounters.set(guildId, currentId);
  },

  // =============================
  // 🔁 SET ENTRIES (REPLACE 🔥)
  // =============================
  setEntries(
    guildId: string,
    entries: BufferedEntry[]
  ) {
    // 🔥 ensure immutability (no external mutations)
    const cloned = entries.map((e) => ({ ...e }));

    buffer.set(guildId, cloned);

    // 🔥 keep ID counter consistent (max id + 1)
    const maxId = cloned.reduce((max, e) => (e.id > max ? e.id : max), 0);
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
    idCounters.delete(guildId); // 🔥 reset ID
  },
};