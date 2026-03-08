// src/eventsPanel/eventService.ts
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
function toNumber(value: any, fallback = 0) { return value != null ? Number(value) : fallback; }
function toBool(value: any) { return value === true || value === "true"; }

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
      headers.forEach((h: string, i: number) => obj[h] = row[i] ?? null);
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
// UPDATE / DELETE CELLS
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

export async function deleteEventRow(eventId: string) {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return;
  const rowIndex = rows.findIndex((r: any[]) => r[0] === eventId);
  if (rowIndex === -1) return;
  await GS.deleteEventRow(rowIndex + 1);
}

// -----------------------------
// PARTICIPANT OPERATIONS
// -----------------------------
export async function addParticipants(eventId: string, nicknames: string[]) {
  const rows = await GS.readEventsSheet();
  const headers = rows[0];
  const rowIndex = rows.findIndex(r => r[0] === eventId);
  if (rowIndex === -1) throw new Error("Event not found");

  const participantsCol = headers.indexOf("participants");
  const absentCol = headers.indexOf("absent");

  const participants = safeJSONParse(rows[rowIndex][participantsCol], []);
  const absent = safeJSONParse(rows[rowIndex][absentCol], []);

  for (const nick of nicknames) {
    if (!participants.includes(nick)) participants.push(nick);
  }

  const newAbsent = absent.filter((n: string) => !nicknames.includes(n));

  await updateEventCell(eventId, "participants", JSON.stringify(participants));
  await updateEventCell(eventId, "absent", JSON.stringify(newAbsent));

  return participants;
}

export async function removeParticipants(eventId: string, nicknames: string[]) {
  const rows = await GS.readEventsSheet();
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
  const rows = await GS.readEventsSheet();
  const headers = rows[0];
  const rowIndex = rows.findIndex(r => r[0] === eventId);
  if (rowIndex === -1) throw new Error("Event not found");

  let participants = safeJSONParse(rows[rowIndex][headers.indexOf("participants")], []);
  let absent = safeJSONParse(rows[rowIndex][headers.indexOf("absent")], []);

  for (const nick of nicknames) {
    if (!participants.includes(nick)) continue;
    participants = participants.filter(n => n !== nick);
    if (!absent.includes(nick)) absent.push(nick);
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

  event.status = "CANCELED";
  await updateEventCell(eventId, "status", "CANCELED");

  return event;
}

// -----------------------------
// DELETE EVENT
// -----------------------------
export async function deleteEvent(eventId: string) {
  await deleteEventRow(eventId);
}

// -----------------------------
// CREATE EVENT
// -----------------------------
export async function createEvent(data: EventObject): Promise<EventObject> {
  const rows = await GS.readEventsSheet();
  const headers = rows[0];

  const newRow = headers.map(h => {
    if (h === "participants") return JSON.stringify(data.participants || []);
    if (h === "absent") return JSON.stringify(data.absent || []);
    if (h === "reminderSent") return data.reminderSent ? "true" : "false";
    if (h === "started") return data.started ? "true" : "false";
    return (data as any)[h] ?? "";
  });

  // Tutaj zakładamy, że GS.appendEventRow dodaje cały wiersz na końcu
  if (typeof GS.appendEventRow === "function") {
    await GS.appendEventRow(newRow);
  } else {
    // fallback: przepisywanie całego arkusza
    await GS.writeEventsSheet([headers, ...rows.slice(1), newRow]);
  }

  return data;
}

// -----------------------------
// CONFIG SHEET HELPERS
// -----------------------------
export async function getConfig(guildId: string): Promise<EventConfig> {
  const rows = await GS.readConfigSheet();
  if (!rows.length) return {};
  let headers = rows[0] || ["guildId","notificationChannel","downloadChannel"];
  const dataRows = rows.slice(1);

  const guildIndex = headers.indexOf("guildId");
  if (guildIndex === -1) return {};

  const row = dataRows.find(r => r[guildIndex] === guildId);
  if (!row) return {};

  const config: EventConfig = {};
  headers.forEach((h, i) => config[h] = row[i] ?? null);
  return config;
}

export async function setConfig(guildId: string, key: string, value: any) {
  const rows = await GS.readConfigSheet();
  let headers = rows[0] || ["guildId","notificationChannel","downloadChannel"];
  const dataRows = rows.slice(1);

  if (!headers.includes(key)) {
    headers.push(key);
    for (const r of dataRows) while(r.length < headers.length) r.push("");
  }

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);

  let row = dataRows.find(r => r[guildIndex] === guildId);
  let rowIndex: number;
  if (!row) {
    row = new Array(headers.length).fill("");
    row[guildIndex] = guildId;
    dataRows.push(row);
    rowIndex = dataRows.length;
  } else {
    rowIndex = dataRows.indexOf(row) + 1;
  }

  await GS.writeConfigSheet([headers, ...dataRows]);
  await GS.updateConfigCell(rowIndex + 1, keyIndex + 1, value);
}

// -----------------------------
// CONFIG SHORTCUTS
// -----------------------------
export async function setNotificationChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "notificationChannel", channelId);
}

export async function setDownloadChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "downloadChannel", channelId);
}