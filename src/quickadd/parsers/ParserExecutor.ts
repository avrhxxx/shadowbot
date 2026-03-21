// src/quickadd/parsers/ParserExecutor.ts
import { ParserType } from "../session/SessionManager";
import { QuickAddEntry } from "../types/QuickAddEntry";

import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";

// =====================================
// 🔥 MAIN EXECUTOR (V2 DEBUG)
// =====================================
export function parseByType(
  type: ParserType | null,
  lines: string[]
): QuickAddEntry[] {
  console.log("=================================");
  console.log("🚀 PARSER EXECUTOR START (V2)");
  console.log("=================================");

  if (!type) {
    console.log("❌ No parser type provided");
    return [];
  }

  console.log(`🧠 Selected parser: ${type}`);
  console.log(`📥 Input lines: ${lines.length}`);

  lines.forEach((line, i) => {
    console.log(`   [${i}] "${line}"`);
  });

  let entries: QuickAddEntry[] = [];

  try {
    switch (type) {
      case "DONATIONS":
        console.log("👉 Running DonationsParser");
        entries = parseDonations(lines);
        break;

      case "DUEL_POINTS":
        console.log("👉 Running DuelPointsParser");
        entries = parseDuelPoints(lines);
        break;

      case "RR_RAID":
        console.log("👉 Running ReservoirRaidParser");
        entries = parseReservoirRaid(lines);
        break;

      case "RR_ATTENDANCE":
        console.log("👉 Running ReservoirAttendanceParser");
        entries = parseReservoirAttendance(lines);
        break;

      default:
        console.log("❌ Unknown parser type");
        return [];
    }
  } catch (err) {
    console.error("💥 Parser crashed:", err);
    return [];
  }

  console.log("=================================");
  console.log(`📊 RAW ENTRIES COUNT: ${entries.length}`);
  console.log("=================================");

  entries.forEach((e, i) => {
    console.log(
      `[RAW ${i}] nick="${e.nickname}" value=${e.value} raw="${e.raw}"`
    );
  });

  if (!entries.length) {
    console.log("💀 PARSER RETURNED 0 ENTRIES");
  }

  // =====================================
  // 🧹 CLEAN
  // =====================================
  console.log("🧹 CLEANING STAGE");

  const cleaned = entries.filter((e, i) => {
    if (!e.nickname || e.nickname.length < 2) {
      console.log(`❌ [CLEAN DROP ${i}] invalid nickname`, e.nickname);
      return false;
    }

    if (e.nickname.toLowerCase() === "donations") {
      console.log(`❌ [CLEAN DROP ${i}] header line`, e.nickname);
      return false;
    }

    if (typeof e.value === "number" && e.value < 0) {
      console.log(`❌ [CLEAN DROP ${i}] negative value`, e.value);
      return false;
    }

    return true;
  });

  console.log(`✅ AFTER CLEAN: ${cleaned.length}`);

  cleaned.forEach((e, i) => {
    console.log(
      `[CLEAN ${i}] nick="${e.nickname}" value=${e.value}`
    );
  });

  // =====================================
  // 🔥 MERGE
  // =====================================
  console.log("🧠 MERGE STAGE");

  const merged = mergeEntries(cleaned);

  console.log(`✅ AFTER MERGE: ${merged.length}`);

  merged.forEach((e, i) => {
    console.log(
      `[MERGED ${i}] nick="${e.nickname}" value=${e.value}`
    );
  });

  console.log("=================================");
  console.log("🏁 PARSER EXECUTOR END");
  console.log("=================================");

  return merged;
}

// =====================================
// 🔥 MERGE ENTRIES (DEBUG)
// =====================================
function mergeEntries(entries: QuickAddEntry[]): QuickAddEntry[] {
  const map = new Map<string, QuickAddEntry>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      console.log("➕ NEW ENTRY:", e.nickname, e.value);
      map.set(key, e);
      continue;
    }

    console.log(
      "🔁 MERGE CHECK:",
      e.nickname,
      "| existing:",
      existing.value,
      "| incoming:",
      e.value
    );

    if (e.value > existing.value) {
      console.log("   ✅ REPLACED (higher value)");
      map.set(key, e);
      continue;
    }

    const eConf = e.confidence ?? 0;
    const exConf = existing.confidence ?? 0;

    if (eConf > exConf) {
      console.log("   ✅ REPLACED (better confidence)");
      map.set(key, e);
    } else {
      console.log("   ⏭️ KEPT EXISTING");
    }
  }

  return Array.from(map.values());
}