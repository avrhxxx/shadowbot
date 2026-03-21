// src/quickadd/parsers/ParserExecutor.ts
import { ParserType } from "../session/SessionManager";
import { QuickAddEntry } from "../types/QuickAddEntry";

import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";

// =====================================
// 🔥 MAIN EXECUTOR
// =====================================
export function parseByType(
  type: ParserType | null,
  lines: string[]
): QuickAddEntry[] {
  console.log("=================================");
  console.log("🚀 PARSER EXECUTOR START");
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
        entries = parseDonations(lines);
        break;

      case "DUEL_POINTS":
        entries = parseDuelPoints(lines);
        break;

      case "RR_RAID":
        entries = parseReservoirRaid(lines);
        break;

      case "RR_ATTENDANCE":
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

  console.log(`📊 Raw entries count: ${entries.length}`);

  if (!entries.length) {
    console.log("💀 PARSER RETURNED 0 ENTRIES");
  }

  // =====================================
  // 🧹 CLEAN
  // =====================================
  const cleaned = entries.filter((e) => {
    if (!e.nickname || e.nickname.length < 2) return false;
    if (e.nickname.toLowerCase() === "donations") return false;
    if (typeof e.value === "number" && e.value < 0) return false;
    return true;
  });

  // =====================================
  // 🔥 MERGE
  // =====================================
  const merged = mergeEntries(cleaned);

  console.log(`🧠 After merge: ${merged.length}`);

  return merged;
}

// =====================================
// 🔥 MERGE ENTRIES
// =====================================
function mergeEntries(entries: QuickAddEntry[]): QuickAddEntry[] {
  const map = new Map<string, QuickAddEntry>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, e);
      continue;
    }

    if (e.value > existing.value) {
      map.set(key, e);
      continue;
    }

    const eConf = e.confidence ?? 0;
    const exConf = existing.confidence ?? 0;

    if (eConf > exConf) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}