import { parseValue } from "../utils/parseValue";

export interface Entry {
  nickname: string;
  value: number;
  raw: string;
}

export class SessionData {
  private static data = new Map<string, Entry[]>();

  // ➕ dodawanie wpisu (BEZ MERGE!)
  static addEntry(guildId: string, entry: Entry) {
    const current = this.data.get(guildId) || [];

    current.push(entry);

    this.data.set(guildId, current);
  }

  // 📥 pobieranie (zwracamy kopię dla bezpieczeństwa)
  static getEntries(guildId: string): Entry[] {
    const entries = this.data.get(guildId) || [];
    return [...entries];
  }

  // 🧹 czyszczenie
  static clear(guildId: string) {
    this.data.delete(guildId);
  }

  // ✏️ update (adjust)
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
      entry.raw = newValue; // 🔥 zachowujemy to co user wpisał
      return true;
    }

    return false;
  }

  // 🗑️ delete
  static removeEntry(guildId: string, index: number): boolean {
    const entries = this.data.get(guildId);
    if (!entries || !entries[index]) return false;

    entries.splice(index, 1);
    return true;
  }

  // 🔗 MERGE (manualny: from → to)
  static mergeEntries(
    guildId: string,
    fromIndex: number,
    toIndex: number
  ): boolean {
    const entries = this.data.get(guildId);
    if (!entries) return false;

    if (!entries[fromIndex] || !entries[toIndex]) return false;
    if (fromIndex === toIndex) return false;

    const from = entries[fromIndex];
    const to = entries[toIndex];

    // 🔥 merge wartości
    to.value += from.value;

    // 🔥 clean preview (bez śladów merge)
    to.raw = this.formatValue(to.value);

    // 🗑️ usuń wpis (większy index pierwszy)
    const first = Math.max(fromIndex, toIndex);
    entries.splice(first, 1);

    return true;
  }

  // 🔧 helper do formatowania
  private static formatValue(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }

    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }

    return `${value}`;
  }
}