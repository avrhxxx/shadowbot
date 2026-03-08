import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as GS from "../googleSheetsStorage";

export interface EventObject {
  id: string;
  guildId: string;
  name: string;
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
}

export interface EventConfig {
  notificationChannel?: string;
  downloadChannel?: string;
  [key: string]: any;
}

// -----------------------------
// HELPERS
// -----------------------------
function safeJSONParse<T>(value: any, fallback: T): T {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function toNumber(value: any, fallback = 0) {
  return value != null ? Number(value) : fallback;
}

function toBool(value: any) {
  return value === true || value === "true";
}

// -----------------------------
// LOAD EVENTS
// -----------------------------
export async function loadEvents(guildId: string): Promise<EventObject[]> {

  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return [];

  const headers: string[] = rows[0];

  return rows.slice(1)
    .map((row: any[]) => {

      const obj: Record<string, any> = {};

      headers.forEach((h: string, i: number) => {
        obj[h] = row[i] ?? null;
      });

      return {
        id: obj.id,
        guildId: obj.guildId,
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
      } as EventObject;

    })
    .filter(e => e.guildId === guildId);
}

export async function getEvents(guildId: string): Promise<EventObject[]> {
  return await loadEvents(guildId);
}

export async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find(e => e.id === eventId) || null;
}

// -----------------------------
// CELL UPDATE
// -----------------------------
export async function updateEventCell(eventId: string, columnName: string, value: any) {

  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return;

  const headers: string[] = rows[0];

  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error(`Column ${columnName} not found`);

  const rowIndex = rows.findIndex((r: any[]) => r[0] === eventId);
  if (rowIndex === -1) throw new Error(`Event ID ${eventId} not found`);

  await GS.updateEventCell(rowIndex + 1, colIndex + 1, value);
}

// -----------------------------
// PARTICIPANT OPERATIONS
// -----------------------------
export async function addParticipants(eventId: string, nicknames: string[]) {

  const rows: any[][] = await GS.readEventsSheet();
  const headers = rows[0];

  const rowIndex = rows.findIndex(r => r[0] === eventId);
  if (rowIndex === -1) throw new Error("Event not found");

  const participantsCol = headers.indexOf("participants");
  const absentCol = headers.indexOf("absent");

  const participants = safeJSONParse(rows[rowIndex][participantsCol], []);
  const absent = safeJSONParse(rows[rowIndex][absentCol], []);

  for (const nick of nicknames) {
    if (!participants.includes(nick)) {
      participants.push(nick);
    }
  }

  const newAbsent = absent.filter((n: string) => !nicknames.includes(n));

  await updateEventCell(eventId, "participants", JSON.stringify(participants));
  await updateEventCell(eventId, "absent", JSON.stringify(newAbsent));

  return participants;
}

export async function removeParticipants(eventId: string, nicknames: string[]) {

  const rows: any[][] = await GS.readEventsSheet();
  const headers = rows[0];

  const rowIndex = rows.findIndex(r => r[0] === eventId);
  if (rowIndex === -1) throw new Error("Event not found");

  const participantsCol = headers.indexOf("participants");
  const absentCol = headers.indexOf("absent");

  const participants = safeJSONParse(rows[rowIndex][participantsCol], []);
  const absent = safeJSONParse(rows[rowIndex][absentCol], []);

  const newParticipants = participants.filter((n: string) => !nicknames.includes(n));
  const newAbsent = absent.filter((n: string) => !nicknames.includes(n));

  await updateEventCell(eventId, "participants", JSON.stringify(newParticipants));
  await updateEventCell(eventId, "absent", JSON.stringify(newAbsent));

  return newParticipants;
}

export async function markAbsent(eventId: string, nicknames: string[]) {

  const rows: any[][] = await GS.readEventsSheet();
  const headers = rows[0];

  const rowIndex = rows.findIndex(r => r[0] === eventId);
  if (rowIndex === -1) throw new Error("Event not found");

  const participantsCol = headers.indexOf("participants");
  const absentCol = headers.indexOf("absent");

  let participants = safeJSONParse(rows[rowIndex][participantsCol], []);
  let absent = safeJSONParse(rows[rowIndex][absentCol], []);

  for (const nick of nicknames) {

    if (!participants.includes(nick)) continue;

    participants = participants.filter((n: string) => n !== nick);

    if (!absent.includes(nick)) {
      absent.push(nick);
    }
  }

  await updateEventCell(eventId, "participants", JSON.stringify(participants));
  await updateEventCell(eventId, "absent", JSON.stringify(absent));

  return absent;
}

// -----------------------------
// EVENT STATUS
// -----------------------------
export async function cancelEvent(guildId: string, eventId: string): Promise<EventObject | null> {

  const event = await getEventById(guildId, eventId);
  if (!event) return null;

  await updateEventCell(eventId, "status", "CANCELED");

  event.status = "CANCELED";

  return event;
}

// -----------------------------
// DELETE EVENT
// -----------------------------
export async function deleteEvent(eventId: string) {

  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return;

  const rowIndex = rows.findIndex((r: any[]) => r[0] === eventId);
  if (rowIndex === -1) return;

  await GS.deleteEventRow(rowIndex + 1);
}

// -----------------------------
// CREATE EVENT
// -----------------------------
export async function createEvent(data: EventObject): Promise<EventObject> {

  const rows: any[][] = await GS.readEventsSheet();
  const headers = rows[0];

  const newRow = headers.map(h => {

    if (h === "participants") return JSON.stringify(data.participants || []);
    if (h === "absent") return JSON.stringify(data.absent || []);
    if (h === "reminderSent") return data.reminderSent ? "true" : "false";
    if (h === "started") return data.started ? "true" : "false";

    return (data as any)[h] ?? "";
  });

  await GS.appendEventRow(newRow);

  return data;
}