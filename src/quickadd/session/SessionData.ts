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

  // 📥 pobieranie
  static getEntries(guildId: string): Entry[] {
    return this.data.get(guildId) || [];
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
      entry.raw = newValue; // 🔥 zachowujemy dokładnie to co user wpisał
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
}