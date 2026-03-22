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
  // 🧠 NORMALIZE KEY (🔥 CRITICAL)
  // =====================================
  private static normalizeKey(nick: string): string {
    return nick.trim().toLowerCase();
  }

  // =====================================
  // 🧠 CORE MERGE ENGINE (🔥 SINGLE SOURCE OF TRUTH)
  // =====================================
  private static mergeIntoMap(map: Map<string, Entry>, entry: Entry) {
    const key = this.normalizeKey(entry.nickname);

    if (!key || entry.value < 0) {
      console.log("❌ INVALID ENTRY SKIPPED:", entry);
      return;
    }

    const existing = map.get(key);

    if (!existing) {
      console.log("➕ NEW ENTRY:", key, entry.value);
      map.set(key, { ...entry });
      return;
    }

    console.log(
      "🔁 MERGE CHECK:",
      key,
      "| existing:",
      existing.value,
      "| incoming:",
      entry.value
    );

    // 🔥 prefer większą wartość
    if (entry.value > existing.value) {
      console.log("   ✅ REPLACED (higher value)");
      map.set(key, { ...entry });
    } else {
      console.log("   ⏭️ KEPT EXISTING");
    }
  }

  // =====================================
  // ➕ ADD SINGLE
  // =====================================
  static addEntry(guildId: string, entry: Entry) {
    this.addEntries(guildId, [entry]);
  }

  // =====================================
  // 🔥 ADD BATCH (CLEAN + MERGE)
  // =====================================
  static addEntries(guildId: string, newEntries: Entry[]) {
    const current = this.data.get(guildId) || [];

    console.log("=================================");
    console.log("📥 SessionData ADD BATCH");
    console.log("=================================");

    const map = new Map<string, Entry>();

    // 🔹 existing
    for (const e of current) {
      this.mergeIntoMap(map, e);
    }

    // 🔹 new
    for (const e of newEntries) {
      this.mergeIntoMap(map, e);
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
      const oldNick = entry.nickname;

      entry.nickname = newValue.trim();

      console.log("   nick:", oldNick, "→", entry.nickname);

      // 🔥 RE-MERGE po zmianie nicku
      this.addEntries(guildId, []);
      return true;
    }

    if (field === "value") {
      const parsed = parseValue(newValue);

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
  // 🔗 MERGE (manual) — FIXED
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

    // 🔥 usuń większy index pierwszy (BUG FIX)
    const first = Math.max(fromIndex, toIndex);
    const second = Math.min(fromIndex, toIndex);

    entries.splice(first, 1);

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