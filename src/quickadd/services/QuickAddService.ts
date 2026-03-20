import {
  ParserType,
  SessionEntry,
} from "../session/SessionManager";

import { saveNickMappings } from "./QuickAddNicknameService";

// =====================================
// 🔥 INPUT
// =====================================
interface QuickAddPayload {
  parserType: ParserType | null;
  entries: SessionEntry[];
  guildId: string;

  // 🔮 FUTURE
  targetId?: string;
}

// =====================================
// 🚀 MAIN ENTRY POINT
// =====================================
export async function processQuickAdd(payload: QuickAddPayload) {
  const { parserType, entries, guildId, targetId } = payload;

  console.log("=== QUICK ADD START ===");
  console.log("Guild:", guildId);
  console.log("ParserType:", parserType);
  console.log("Entries:", entries.length);
  console.log("Target:", targetId);
  console.log("=======================");

  if (!parserType) {
    console.log("❌ Missing parserType");
    throw new Error("Parser type not detected.");
  }

  if (!entries || entries.length === 0) {
    console.log("❌ No entries to process");
    throw new Error("No entries provided.");
  }

  // =====================================
  // 🧠 SAVE NICK MAPPINGS (🔥 NOWY KROK)
  // =====================================
  try {
    console.log("🧠 Saving nickname mappings before processing...");
    await saveNickMappings(entries);
  } catch (err) {
    console.error("⚠️ Nick mapping save failed (non-blocking):", err);
    // 🔥 NIE BLOKUJEMY flow!
  }

  // =====================================
  // 🚀 ROUTING
  // =====================================
  switch (parserType) {
    case "RR_RAID":
      return handleRRRaid(guildId, entries, targetId);

    case "RR_ATTENDANCE":
      return handleRRAttendance(guildId, entries, targetId);

    case "DONATIONS":
      return handleDonations(guildId, entries, targetId);

    case "DUEL_POINTS":
      return handleDuelPoints(guildId, entries, targetId);

    default:
      console.log("❌ Unsupported parser type:", parserType);
      throw new Error(`Unsupported parser type: ${parserType}`);
  }
}

// =====================================
// 🧠 EVENT HANDLERS
// =====================================
async function handleRRRaid(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("=== HANDLE RR RAID ===");
  console.log("Guild:", guildId);
  console.log("Entries:", entries.length);

  const nicknames = entries.map(e => e.nickname);

  console.log("Nicknames:", nicknames);

  // 🔮 FUTURE:
  // await EventService.addParticipants(guildId, targetId!, nicknames);

  console.log("✅ RR RAID DONE");

  return true;
}

async function handleRRAttendance(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("=== HANDLE RR ATTENDANCE ===");
  console.log("Guild:", guildId);
  console.log("Entries:", entries.length);

  const nicknames = entries.map(e => e.nickname);

  console.log("Nicknames:", nicknames);

  // 🔮 FUTURE:
  // await EventService.addParticipants(guildId, targetId!, nicknames);

  console.log("✅ RR ATTENDANCE DONE");

  return true;
}

// =====================================
// 💰 POINTS HANDLERS
// =====================================
async function handleDonations(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("=== HANDLE DONATIONS ===");
  console.log("Guild:", guildId);
  console.log("Entries:", entries.length);

  for (const e of entries) {
    const payload = {
      category: "Donations" as const,
      nick: e.nickname,
      points: String(e.value),
      week: targetId ?? "UNKNOWN",
    };

    console.log("💰 ADD DONATION:", payload);

    // 🔮 FUTURE:
    // await PointsService.addPoints(payload);
  }

  console.log("✅ DONATIONS DONE");

  return true;
}

async function handleDuelPoints(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("=== HANDLE DUEL POINTS ===");
  console.log("Guild:", guildId);
  console.log("Entries:", entries.length);

  for (const e of entries) {
    const payload = {
      category: "Duel" as const,
      nick: e.nickname,
      points: String(e.value),
      week: targetId ?? "UNKNOWN",
    };

    console.log("⚔️ ADD DUEL:", payload);

    // 🔮 FUTURE:
    // await PointsService.addPoints(payload);
  }

  console.log("✅ DUEL POINTS DONE");

  return true;
}