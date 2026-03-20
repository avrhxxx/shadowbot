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
        console.log("➡️ Running DonationsParser...");
        entries = parseDonations(lines);
        break;

      case "DUEL_POINTS":
        console.log("➡️ Running DuelPointsParser...");
        entries = parseDuelPoints(lines);
        break;

      case "RR_RAID":
        console.log("➡️ Running ReservoirRaidParser...");
        entries = parseReservoirRaid(lines);
        break;

      case "RR_ATTENDANCE":
        console.log("➡️ Running ReservoirAttendanceParser...");
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
  console.log(`📊 Raw entries count: ${entries.length}`);
  console.log("=================================");

  entries.forEach((e, i) => {
    console.log(
      `[${i}] nick="${e.nickname}" value=${e.value} status=${e.status}`
    );
  });

  // =====================================
  // 🧹 SAFETY FILTER
  // =====================================
  const cleaned = entries.filter((e, i) => {
    if (!e.nickname || e.nickname.length < 2) {
      console.log(`❌ Removed [${i}] – invalid nickname`);
      return false;
    }

    if (typeof e.value === "number" && e.value < 0) {
      console.log(`❌ Removed [${i}] – negative value`);
      return false;
    }

    return true;
  });

  console.log("=================================");
  console.log(`✅ After clean: ${cleaned.length}`);
  console.log("=================================");

  // =====================================
  // 🔥 FALLBACK (jeśli parser padł)
  // =====================================
  if (cleaned.length === 0) {
    console.log("⚠️ Parser returned 0 entries");
    console.log("🆘 Running fallback parser...");

    const fallback = tryFallback(lines);

    console.log(`🆘 Fallback entries: ${fallback.length}`);

    fallback.forEach((e, i) => {
      console.log(
        `[FALLBACK ${i}] nick="${e.nickname}" value=${e.value}`
      );
    });

    return fallback;
  }

  console.log("🎉 PARSER EXECUTOR SUCCESS");
  return cleaned;
}

// =====================================
// 🆘 FALLBACK PARSER
// =====================================
function tryFallback(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🆘 FALLBACK START");
  console.log("=================================");

  const results: QuickAddEntry[] = [];

  let lineId = 1;

  for (const line of lines) {
    console.log(`🔍 Fallback checking: "${line}"`);

    const match = line.match(/^(.+?)\s+(\d{3,})$/);

    if (!match) {
      console.log("   ❌ No match");
      continue;
    }

    const nickname = match[1].trim();
    const value = parseInt(match[2], 10);

    if (!nickname || isNaN(value)) {
      console.log("   ❌ Invalid parsed data");
      continue;
    }

    console.log(`   ✅ Parsed → ${nickname} = ${value}`);

    results.push({
      lineId: lineId++,
      nickname,
      value,
      raw: line,
      rawText: line,
      status: "UNREADABLE",
      confidence: 0.3,
      sourceType: "OCR",
    });
  }

  console.log("=================================");
  console.log("🆘 FALLBACK END");
  console.log("=================================");

  return results;
}