// src/quickadd/session/SessionData.ts

import { parseValue } from "../utils/parseValue";

export interface Entry {
  nickname: string;
  value: number;
  raw: string;
}

export class SessionData {
  private static data = new Map<string, Entry[]>();

  // ➕ add
  static addEntry(guildId: string, entry: Entry) {
    const current = this.data.get(guildId) || [];
    this.data.set(guildId, [...current, entry]); // 🔥 immutable
  }

  // 📥 get
  static getEntries(guildId: string): Entry[] {
    const entries = this.data.get(guildId) || [];
    return [...entries];
  }

  // 🧹 clear
  static clear(guildId: string) {
    this.data.delete(guildId);
  }

  // ✏️ update
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
      entry.nickname = newValue.trim(); // 🔥 fix
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

  // 🗑️ delete
  static removeEntry(guildId: string, index: number): boolean {
    const entries = this.data.get(guildId);
    if (!entries || !entries[index]) return false;

    entries.splice(index, 1);
    return true;
  }

  // 🔗 merge
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

    // 🔥 merge
    to.value += from.value;

    // 🔥 clean raw
    to.raw = this.formatValue(to.value);

    // 🔥 usuń ZAWSZE from
    entries.splice(fromIndex, 1);

    return true;
  }

  // 🔧 helper
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