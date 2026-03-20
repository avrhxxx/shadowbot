// src/quickadd/session/SessionData.ts

import { parseValue } from "../utils/parseValue";

export interface Entry {
  nickname: string;
  value: number;
  raw: string;
}

export class SessionData {
  private static data = new Map<string, Entry[]>();

  // =====================================
  // ➕ ADD SINGLE (legacy)
  // =====================================
  static addEntry(guildId: string, entry: Entry) {
    this.addEntries(guildId, [entry]);
  }

  // =====================================
  // 🔥 ADD BATCH (NOWE - KLUCZOWE)
  // =====================================
  static addEntries(guildId: string, newEntries: Entry[]) {
    const current = this.data.get(guildId) || [];

    console.log("📥 SessionData ADD BATCH");
    console.log("➡️ incoming:", newEntries.length);
    console.log("📦 current:", current.length);

    const map = new Map<string, Entry>();

    // 🔹 najpierw wrzuć stare
    for (const e of current) {
      map.set(e.nickname.toLowerCase(), { ...e });
    }

    // 🔹 potem nowe (nadpisują lepsze)
    for (const e of newEntries) {
      const key = e.nickname.toLowerCase();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...e });
        continue;
      }

      // 🔥 prefer bigger value
      if (e.value > existing.value) {
        map.set(key, { ...e });
        continue;
      }
    }

    const merged = Array.from(map.values());

    console.log("🧠 after merge:", merged.length);

    this.data.set(guildId, merged);
  }

  // =====================================
  // 📥 GET
  // =====================================
  static getEntries(guildId: string): Entry[] {
    const entries = this.data.get(guildId) || [];
    return [...entries];
  }

  // =====================================
  // 🧹 CLEAR
  // =====================================
  static clear(guildId: string) {
    this.data.delete(guildId);
  }

  // =====================================
  // ✏️ UPDATE
  // =====================================
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
      entry.nickname = newValue.trim();
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

  // =====================================
  // 🗑️ DELETE
  // =====================================
  static removeEntry(guildId: string, index: number): boolean {
    const entries = this.data.get(guildId);
    if (!entries || !entries[index]) return false;

    entries.splice(index, 1);
    return true;
  }

  // =====================================
  // 🔗 MERGE (manual)
  // =====================================
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

    to.value += from.value;
    to.raw = this.formatValue(to.value);

    entries.splice(fromIndex, 1);

    return true;
  }

  // =====================================
  // 🔧 FORMAT
  // =====================================
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