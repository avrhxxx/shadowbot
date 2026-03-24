// =====================================
// 📁 src/quickadd/storage/QuickAddBuffer.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
};

type BufferedEntry = {
  id: number;
  nickname: string;
  value: number;

  // 🔥 NEW — VALIDATION (optional, backward compatible)
  status?: string;
  confidence?: number;
  suggestion?: string;
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

        // 🔥 NEW (safe spread)
        status: entry.status,
        confidence: entry.confidence,
        suggestion: entry.suggestion,
      });
    }

    idCounters.set(guildId, currentId);
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