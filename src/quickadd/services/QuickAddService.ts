// src/quickadd/services/QuickAddService.ts

import {
  ParserType,
  SessionEntry,
} from "../session/SessionManager";

// 🔥 INPUT DO SERWISU (skalowalny)
interface QuickAddPayload {
  parserType: ParserType | null;
  entries: SessionEntry[];
  guildId: string;

  // 🔮 FUTURE (select menu)
  targetId?: string; // eventId lub week
}

export async function processQuickAdd(payload: QuickAddPayload) {
  const { parserType, entries, guildId, targetId } = payload;

  if (!parserType) {
    throw new Error("Parser type not detected.");
  }

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
      throw new Error(`Unsupported parser type: ${parserType}`);
  }
}

// -----------------------------
// 🧠 EVENT HANDLERS
// -----------------------------

async function handleRRRaid(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("RR RAID", { guildId, entries, targetId });

  const nicknames = entries.map(e => e.nickname);

  // 🔮 FUTURE:
  // await EventService.addParticipants(guildId, targetId!, nicknames);

  return true;
}

async function handleRRAttendance(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("RR ATTEND", { guildId, entries, targetId });

  const nicknames = entries.map(e => e.nickname);

  // 🔮 FUTURE:
  // await EventService.addParticipants(guildId, targetId!, nicknames);

  return true;
}

// -----------------------------
// 💰 POINTS HANDLERS
// -----------------------------

async function handleDonations(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("DONATIONS", { guildId, entries, targetId });

  for (const e of entries) {
    const payload = {
      category: "Donations" as const,
      nick: e.nickname,
      points: String(e.value),
      week: targetId ?? "UNKNOWN", // 🔮 później select
    };

    // 🔮 FUTURE:
    // await PointsService.addPoints(payload);
  }

  return true;
}

async function handleDuelPoints(
  guildId: string,
  entries: SessionEntry[],
  targetId?: string
) {
  console.log("DUEL", { guildId, entries, targetId });

  for (const e of entries) {
    const payload = {
      category: "Duel" as const,
      nick: e.nickname,
      points: String(e.value),
      week: targetId ?? "UNKNOWN",
    };

    // 🔮 FUTURE:
    // await PointsService.addPoints(payload);
  }

  return true;
}