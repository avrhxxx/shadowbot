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
// EVENTS SHEET HELPERS
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

// -----------------------------
// UPDATE / DELETE EVENT CELLS
// -----------------------------
export async function updateEventCell(eventId: string, columnName: string, value: any) {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return;

  const headers: string[] = rows[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error(`Column ${columnName} not found`);

  const rowIndex = rows.findIndex((r: any[]) => r[0] === eventId);
  if (rowIndex === -1) throw new Error(`Event ID ${eventId} not found`);

  await GS.updateEventCell(rowIndex + 1, colIndex + 1, value); // 1-indexed dla Sheets
}

export async function deleteEventRow(eventId: string) {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return;

  const rowIndex = rows.findIndex((r: any[]) => r[0] === eventId);
  if (rowIndex === -1) return;

  await GS.deleteEventRow(rowIndex + 1);
}

// -----------------------------
// EVENTS CRUD
// -----------------------------
export async function getEvents(guildId: string): Promise<EventObject[]> {
  return await loadEvents(guildId);
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  const rows: any[][] = await GS.readEventsSheet();
  const headers: string[] = rows[0] || [
    "id","guildId","name","day","month","hour","minute","year","reminderBefore","status",
    "participants","absent","createdAt","reminderSent","started"
  ];

  const dataRows: any[][] = rows.slice(1);
  const guildIndex = 1;

  const rowMap: Record<string, any[]> = {};
  dataRows.forEach((r: any[]) => { if(r[guildIndex] === guildId) rowMap[r[0]] = r; });

  for (const e of events) {
    const copy: Record<string, any> = { ...e };
    copy.participants = JSON.stringify(copy.participants || []);
    copy.absent = JSON.stringify(copy.absent || []);
    copy.reminderSent = e.reminderSent ? "true" : "false";
    copy.started = e.started ? "true" : "false";

    if (!rowMap[e.id]) {
      const newRow = headers.map(h => copy[h] ?? "");
      rowMap[e.id] = newRow;
    }
  }

  const otherRows = dataRows.filter((r: any[]) => r[guildIndex] !== guildId);
  await GS.writeEventsSheet([headers, ...otherRows, ...Object.values(rowMap)]);
}

export async function createEvent(data: EventObject): Promise<EventObject> {
  const events = await getEvents(data.guildId);
  events.push(data);
  await saveEvents(data.guildId, events);
  return data;
}

export async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find(e => e.id === eventId) || null;
}

export async function cancelEvent(guildId: string, eventId: string): Promise<EventObject | null> {
  const event = await getEventById(guildId, eventId);
  if (!event) return null;
  event.status = "CANCELED";
  await updateEventCell(event.id, "status", "CANCELED");
  return event;
}

export async function deleteEvent(guildId: string, eventId: string) {
  await deleteEventRow(eventId);
}

// -----------------------------
// CONFIG SHEET HELPERS
// -----------------------------
export async function getConfig(guildId: string): Promise<EventConfig> {
  const rows: any[][] = await GS.readConfigSheet();
  if (!rows.length) return {};
  let headers: string[] = rows[0] || ["guildId","notificationChannel","downloadChannel"];
  let dataRows: any[][] = rows.slice(1);

  // dodaj brakujące nagłówki
  if (headers.length === 0) headers = ["guildId","notificationChannel","downloadChannel"];

  const guildIndex = headers.indexOf("guildId");
  if (guildIndex === -1) return {};

  const row = dataRows.find((r: any[]) => r[guildIndex] === guildId);
  if (!row) return {};

  const config: EventConfig = {};
  headers.forEach((h, i) => config[h] = row[i] ?? null);
  return config;
}

export async function setConfig(guildId: string, key: string, value: any) {
  let rows: any[][] = await GS.readConfigSheet();
  let headers: string[] = rows[0] || ["guildId","notificationChannel","downloadChannel"];
  let dataRows: any[][] = rows.slice(1);

  // jeśli nagłówki nie zawierają klucza, dodaj na końcu
  if (!headers.includes(key)) {
    headers.push(key);
    dataRows = dataRows.map((r: any[]) => { while(r.length < headers.length) r.push(""); return r; });
  }

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);

  // znajdź wiersz dla gildii
  let row = dataRows.find((r: any[]) => r[guildIndex] === guildId);
  let rowIndex: number;

  if (!row) {
    row = new Array(headers.length).fill("");
    row[guildIndex] = guildId;
    dataRows.push(row);
    rowIndex = dataRows.length; // wiersz w Sheets (1-indexed, +1 dla nagłówka)
  } else {
    rowIndex = dataRows.indexOf(row) + 1; // +1 bo nagłówek w wierszu 1
  }

  // zapisz nagłówki jeśli puste
  await GS.writeConfigSheet([headers, ...dataRows]);

  // aktualizacja pojedynczej komórki
  await GS.updateConfigCell(rowIndex + 1, keyIndex + 1, value); // +1 dla A1 notation
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