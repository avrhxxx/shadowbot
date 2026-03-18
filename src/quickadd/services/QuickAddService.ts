import { ParserType } from "../session/SessionManager";

export async function processQuickAdd(
  parserType: ParserType,
  entries: any[]
) {
  switch (parserType) {
    case "RR_RAID":
      return handleRRRaid(entries);

    case "RR_ATTENDANCE":
      return handleRRAttendance(entries);

    case "DONATIONS":
      return handleDonations(entries);

    case "DUEL_POINTS":
      return handleDuelPoints(entries);
  }
}

// -----------------------------

async function handleRRRaid(entries: any[]) {
  console.log("RR RAID", entries);
  // 👉 EventService.addRaid(entries)
}

async function handleRRAttendance(entries: any[]) {
  console.log("RR ATTEND", entries);
  // 👉 EventService.addAttendance(entries)
}

async function handleDonations(entries: any[]) {
  console.log("DONATIONS", entries);
  // 👉 PointsService.addDonations(entries)
}

async function handleDuelPoints(entries: any[]) {
  console.log("DUEL", entries);
  // 👉 PointsService.addDuel(entries)
}