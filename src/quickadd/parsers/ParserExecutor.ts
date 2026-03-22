// src/quickadd/parsers/ParserExecutor.ts

import { ParserType } from "../session/SessionManager";
import { QuickAddEntry } from "../types/QuickAddEntry";

import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";

// =====================================
// 🧠 NORMALIZE KEY (🔥 MUST MATCH SessionData)
// =====================================
function normalizeKey(nick: string): string {
  return nick.trim().toLowerCase();
}

// =====================================
// 🔥 MAIN EXECUTOR (IMPROVED)
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

  let entries: QuickAddEntry[] = [];

  try {
    switch (type) {
      case "DONATIONS":
        console.log("👉 DonationsParser");
        entries = parseDonations(lines);
        break;

      case "DUEL_POINTS":
        console.log("👉 DuelPointsParser");
        entries = parseDuelPoints(lines);
        break;

      case "RR_RAID":
        console.log("👉 ReservoirRaidParser");
        entries = parseReservoirRaid(lines);
        break;

      case "RR_ATTENDANCE":
        console.log("👉 ReservoirAttendanceParser");
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
  console.log(`📊 RAW ENTRIES: ${entries.length}`);
  console.log("=================================");

  entries.forEach((e, i) => {
    console.log(
      `[RAW ${i}] nick="${e.nickname}" value=${e.value} conf=${e.confidence}`
    );
  });

  if (!entries.length) {
    console.log("💀 PARSER RETURNED 0 ENTRIES");
    return [];
  }

  // =====================================
  // 🧹 CLEAN
  // =====================================
  console.log("🧹 CLEANING");

  const cleaned = entries.filter((e, i) => {
    const nick = e.nickname?.trim();

    if (!nick || nick.length < 2) {
      console.log(`❌ [DROP ${i}] invalid nickname`, nick);
      return false;
    }

    if (nick.toLowerCase() === "donations") {
      console.log(`❌ [DROP ${i}] header`, nick);
      return false;
    }

    if (typeof e.value !== "number" || isNaN(e.value)) {
      console.log(`❌ [DROP ${i}] NaN value`, e.value);
      return false;
    }

    if (e.value < 0) {
      console.log(`❌ [DROP ${i}] negative`, e.value);
      return false;
    }

    return true;
  });

  console.log(`✅ CLEANED: ${cleaned.length}`);

  // =====================================
  // 🔥 MERGE (CONSISTENT WITH SessionData)
  // =====================================
  console.log("🧠 MERGING");

  const map = new Map<string, QuickAddEntry>();

  for (const e of cleaned) {
    const key = normalizeKey(e.nickname);
    const existing = map.get(key);

    if (!existing) {
      console.log("➕ NEW:", e.nickname, e.value);
      map.set(key, { ...e });
      continue;
    }

    console.log(
      "🔁 MERGE:",
      e.nickname,
      "| existing:",
      existing.value,
      "| incoming:",
      e.value
    );

    const eConf = e.confidence ?? 0;
    const exConf = existing.confidence ?? 0;

    if (e.value > existing.value) {
      console.log("   ✅ REPLACED (value)");
      map.set(key, { ...e });
      continue;
    }

    if (eConf > exConf) {
      console.log("   ✅ REPLACED (confidence)");
      map.set(key, { ...e });
    } else {
      console.log("   ⏭️ KEPT");
    }
  }

  const merged = Array.from(map.values());

  console.log(`✅ FINAL: ${merged.length}`);

  merged.forEach((e, i) => {
    console.log(
      `[FINAL ${i}] nick="${e.nickname}" value=${e.value}`
    );
  });

  console.log("=================================");
  console.log("🏁 PARSER EXECUTOR END");
  console.log("=================================");

  return merged;
}