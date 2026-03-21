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
  // ➕ ADD SINGLE
  // =====================================
  static addEntry(guildId: string, entry: Entry) {
    this.addEntries(guildId, [entry]);
  }

  // =====================================
  // 🔥 ADD BATCH (FULL DEBUG)
  // =====================================
  static addEntries(guildId: string, newEntries: Entry[]) {
    const current = this.data.get(guildId) || [];

    console.log("=================================");
    console.log("📥 SessionData ADD BATCH");
    console.log("=================================");

    console.log("➡️ incoming:", newEntries.length);
    newEntries.forEach((e, i) => {
      console.log(
        `[IN ${i}] nick="${e.nickname}" value=${e.value} raw="${e.raw}"`
      );
    });

    console.log("📦 current:", current.length);
    current.forEach((e, i) => {
      console.log(
        `[CUR ${i}] nick="${e.nickname}" value=${e.value}`
      );
    });

    const map = new Map<string, Entry>();

    // =====================================
    // 🔹 LOAD EXISTING
    // =====================================
    for (const e of current) {
      const key = e.nickname.toLowerCase();

      console.log("🧠 LOAD EXISTING:", key, e.value);

      map.set(key, { ...e });
    }

    // =====================================
    // 🔹 APPLY NEW
    // =====================================
    for (const e of newEntries) {
      const key = e.nickname.toLowerCase();
      const existing = map.get(key);

      if (!existing) {
        console.log("➕ NEW ENTRY:", key, e.value);
        map.set(key, { ...e });
        continue;
      }

      console.log(
        "🔁 MERGE CHECK:",
        key,
        "| existing:",
        existing.value,
        "| incoming:",
        e.value
      );

      // 🔥 prefer bigger value
      if (e.value > existing.value) {
        console.log("   ✅ REPLACED (higher value)");
        map.set(key, { ...e });
      } else {
        console.log("   ⏭️ KEPT EXISTING");
      }
    }

    const merged = Array.from(map.values());

    console.log("=================================");
    console.log("🧠 AFTER MERGE:", merged.length);
    console.log("=================================");

    merged.forEach((e, i) => {
      console.log(
        `[FINAL ${i}] nick="${e.nickname}" value=${e.value}`
      );
    });

    this.data.set(guildId, merged);
  }

  // =====================================
  // 📥 GET
  // =====================================
  static getEntries(guildId: string): Entry[] {
    const entries = this.data.get(guildId) || [];

    console.log("📤 GET ENTRIES:", entries.length);

    entries.forEach((e, i) => {
      console.log(`[GET ${i}]`, e.nickname, e.value);
    });

    return [...entries];
  }

  // =====================================
  // 🧹 CLEAR
  // =====================================
  static clear(guildId: string) {
    console.log("🧹 CLEAR SESSION DATA:", guildId);
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

    console.log("✏️ UPDATE ENTRY:", index, field, newValue);

    if (!entries || !entries[index]) {
      console.log("❌ UPDATE FAILED (no entry)");
      return false;
    }

    const entry = entries[index];

    if (field === "nick") {
      console.log("   old nick:", entry.nickname);
      entry.nickname = newValue.trim();
      console.log("   new nick:", entry.nickname);
      return true;
    }

    if (field === "value") {
      const parsed = parseValue(newValue);

      console.log("   parsed value:", parsed);

      if (parsed === null) {
        console.log("❌ INVALID VALUE");
        return false;
      }

      entry.value = parsed;
      entry.raw = newValue;

      console.log("   updated value:", entry.value);

      return true;
    }

    return false;
  }

  // =====================================
  // 🗑️ DELETE
  // =====================================
  static removeEntry(guildId: string, index: number): boolean {
    const entries = this.data.get(guildId);

    console.log("🗑️ REMOVE ENTRY:", index);

    if (!entries || !entries[index]) {
      console.log("❌ REMOVE FAILED");
      return false;
    }

    console.log(
      "   removing:",
      entries[index].nickname,
      entries[index].value
    );

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

    console.log("🔗 MANUAL MERGE:", fromIndex, "→", toIndex);

    if (!entries) return false;
    if (!entries[fromIndex] || !entries[toIndex]) return false;
    if (fromIndex === toIndex) return false;

    const from = entries[fromIndex];
    const to = entries[toIndex];

    console.log(
      "   merging:",
      from.nickname,
      from.value,
      "→",
      to.nickname,
      to.value
    );

    to.value += from.value;
    to.raw = this.formatValue(to.value);

    entries.splice(fromIndex, 1);

    console.log("   result:", to.value);

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