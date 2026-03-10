import * as GS from "../googleSheetsStorage";

export interface EventObject {
  id: string;
  guildId: string;
  name: string;
  eventType: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  year: number;
  reminderBefore?: number;
  status: "ACTIVE" | "PAST" | "CANCELED";
  participants: string[];
  absent: string[];
  createdAt: number;
  reminderSent: boolean;
  started: boolean;
  lastBirthdayYear?: number;
}

// -----------------------------
// HELPERS
// -----------------------------
function safeJSONParse<T>(value: any, fallback: T): T {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function toNumber(value: any, fallback = 0) { return value != null ? Number(value) : fallback; }
function toBool(value: any) { return value === true || value === "true"; }

// -----------------------------
// LOAD EVENTS
// -----------------------------
export async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return null;
  const headers = rows[0];
  const idIndex = headers.indexOf("id");
  const guildIndex = headers.indexOf("guildId");
  if (idIndex === -1 || guildIndex === -1) return null;

  const row = rows.slice(1).find(r => r[idIndex] === eventId && r[guildIndex] === guildId);
  if (!row) return null;

  const obj: Record<string, any> = {};
  headers.forEach((h, i) => obj[h] = row[i] ?? null);
  return {
    id: obj.id,
    guildId: obj.guildId,
    eventType: obj.eventType ?? "custom",
    name: obj.name,
    day: toNumber(obj.day),
    month: toNumber(obj.month),
    hour: toNumber(obj.hour),
    minute: toNumber(obj.minute),
    year: obj.year ? toNumber(obj.year) : new Date().getUTCFullYear(),
    reminderBefore: obj.reminderBefore ? toNumber(obj.reminderBefore) : undefined,
    status: obj.status as "ACTIVE" | "PAST" | "CANCELED",
    participants: safeJSONParse(obj.participants, []),
    absent: safeJSONParse(obj.absent, []),
    createdAt: toNumber(obj.createdAt),
    reminderSent: toBool(obj.reminderSent),
    started: toBool(obj.started),
    lastBirthdayYear: toNumber(obj.lastBirthdayYear ?? 0)
  };
}

// -----------------------------
// REMINDER-SPECIFIC UPDATE
// -----------------------------
export async function checkAndSetReminder(eventId: string, reminderValue: boolean): Promise<boolean> {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return false;

  const headers: string[] = rows[0];
  const reminderIndex = headers.indexOf("reminderSent");
  const idIndex = headers.indexOf("id");
  if (reminderIndex === -1 || idIndex === -1) throw new Error("Required columns not found");

  const rowIndex = rows.findIndex(r => r[idIndex] === eventId);
  if (rowIndex === -1) return false;

  const currentValue = rows[rowIndex][reminderIndex] === "true";
  if (!currentValue && reminderValue) {
    await GS.updateEventCell(rowIndex + 1, reminderIndex + 1, "true");
  }

  return !currentValue; // true jeśli reminder jeszcze nie był wysłany
}

// -----------------------------
// HELPER DO REMINDERA (tylko ID)
// -----------------------------
export async function getAllEventIdsFromService(guildId: string): Promise<string[]> {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return [];
  const headers = rows[0];
  const idIndex = headers.indexOf("id");
  const guildIndex = headers.indexOf("guildId");
  if (idIndex === -1 || guildIndex === -1) return [];

  return rows.slice(1).filter(r => r[guildIndex] === guildId).map(r => r[idIndex]);
}