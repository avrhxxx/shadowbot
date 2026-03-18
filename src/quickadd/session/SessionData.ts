interface Entry {
  nickname: string;
  value: number;
  raw: string;
}

function formatValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  return `${value}`;
}

export class SessionData {
  private static data = new Map<string, Entry[]>();

  static addEntry(guildId: string, entry: Entry) {
    const current = this.data.get(guildId) || [];

    const existing = current.find(
      (e) => e.nickname.toLowerCase() === entry.nickname.toLowerCase()
    );

    if (existing) {
      existing.value += entry.value;

      // 🔥 po merge generujemy nowy RAW
      existing.raw = formatValue(existing.value);
    } else {
      current.push(entry);
    }

    this.data.set(guildId, current);
  }

  static getEntries(guildId: string): Entry[] {
    return this.data.get(guildId) || [];
  }

  static clear(guildId: string) {
    this.data.delete(guildId);
  }
}