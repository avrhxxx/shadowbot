// =====================================
// 📁 src/quickadd/storage/QuickAddBuffer.ts
// =====================================

type ParsedEntry = {
  nickname: string;
  value: number;
};

const buffer = new Map<string, ParsedEntry[]>();

export const QuickAddBuffer = {
  // =============================
  // ➕ ADD ENTRIES
  // =============================
  addEntries(guildId: string, entries: ParsedEntry[]) {
    if (!buffer.has(guildId)) {
      buffer.set(guildId, []);
    }

    const current = buffer.get(guildId)!;

    current.push(...entries);
  },

  // =============================
  // 📥 GET ENTRIES
  // =============================
  getEntries(guildId: string): ParsedEntry[] {
    return buffer.get(guildId) || [];
  },

  // =============================
  // 🧹 CLEAR
  // =============================
  clear(guildId: string) {
    buffer.delete(guildId);
  },
};