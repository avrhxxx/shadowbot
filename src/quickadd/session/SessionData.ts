import { parseValue } from "../utils/parseValue";

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

      // 🔥 aktualizujemy RAW po merge
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

  static updateEntry(
    guildId: string,
    index: number,
    field: "nick" | "value",
    newValue: string
  ): boolean {
    const entries = this.data.get(guildId);
    if (!entries || !entries[index]) return false;

    const entry = entries[index];

    if (field === "nick") {
      entry.nickname = newValue;
      return true;
    }

    if (field === "value") {
      const parsed = parseValue(newValue);
      if (parsed === null) return false;

      entry.value = parsed;
      entry.raw = newValue;
      return true;
    }

    return false;
  }
}