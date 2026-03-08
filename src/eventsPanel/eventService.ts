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
// EVENTS SHEET HELPERS (minimal overwrite)
// -----------------------------
async function loadEvents(guildId: string): Promise<EventObject[]> {
  const rows = await GS.readEventsSheet();
  if (!rows.length) return [];

  const headers = rows[0];
  return rows.slice(1)
    .map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => obj[h] = row[i] ?? null);

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

async function saveEventsSheet(guildId: string, events: EventObject[]) {
  const rows = await GS.readEventsSheet();
  const headers = rows[0] || [
    "id","guildId","name","day","month","hour","minute","year","reminderBefore","status",
    "participants","absent","createdAt","reminderSent","started"
  ];

  const dataRows = rows.slice(1);
  const guildIndex = 1; // column guildId

  // Stwórz mapę istniejących wierszy po ID
  const rowMap: Record<string, any[]> = {};
  dataRows.forEach(r => { if(r[guildIndex] === guildId) rowMap[r[0]] = r; });

  for (const e of events) {
    const copy: Record<string, any> = { ...e };
    copy.participants = JSON.stringify(copy.participants || []);
    copy.absent = JSON.stringify(copy.absent || []);
    copy.reminderSent = e.reminderSent ? "true" : "false";
    copy.started = e.started ? "true" : "false";

    if (rowMap[e.id]) {
      // Nadpisz istniejący wiersz minimalnie
      const existingRow = rowMap[e.id];
      const newRow = headers.map((h, i) => copy[h] ?? existingRow[i] ?? "");
      rowMap[e.id] = newRow;
    } else {
      // Nowy wiersz
      const newRow = headers.map(h => copy[h] ?? "");
      rowMap[e.id] = newRow;
    }
  }

  // Pozostałe wiersze z innych guildów
  const otherRows = dataRows.filter(r => r[guildIndex] !== guildId);

  // Finalny zapis minimalny
  await GS.writeEventsSheet([headers, ...otherRows, ...Object.values(rowMap)]);
}

// -----------------------------
// EVENTS CRUD
// -----------------------------
export async function getEvents(guildId: string): Promise<EventObject[]> {
  return await loadEvents(guildId);
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  await saveEventsSheet(guildId, events);
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
  const events = await getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) return null;
  event.status = "CANCELED";
  await saveEvents(guildId, events);
  return event;
}

export async function deleteEvent(guildId: string, eventId: string) {
  const events = await getEvents(guildId);
  const updated = events.filter(e => e.id !== eventId);
  await saveEvents(guildId, updated);
}

// -----------------------------
// CONFIG SHEET HELPERS (minimal overwrite + poprawka)
// -----------------------------
async function loadConfig(guildId: string): Promise<EventConfig> {
  const rows = await GS.readConfigSheet();
  if (!rows.length) return {};
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const guildIndex = headers.indexOf("guildId");
  if (guildIndex === -1) return {};

  const row = dataRows.find(r => r[guildIndex] === guildId);
  if (!row) return {};

  const config: EventConfig = {};
  headers.forEach((h, i) => config[h] = row[i] ?? null);
  return config;
}

async function saveConfig(guildId: string, key: string, value: any) {
  const rows = await GS.readConfigSheet();
  let headers = rows[0] || [];
  let dataRows = rows.slice(1);

  if (!headers.includes(key)) {
    headers.push(key);
    dataRows = dataRows.map(r => { while(r.length < headers.length) r.push(""); return r; });
  }

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);

  // mapa wierszy po guildId
  const rowMap: Record<string, any[]> = {};
  dataRows.forEach(r => { if (r[guildIndex]) rowMap[r[guildIndex]] = r; });

  let row = rowMap[guildId];
  if (!row) {
    // nowy wiersz
    row = new Array(headers.length).fill("");
    row[guildIndex] = guildId;
    row[keyIndex] = value;
    rowMap[guildId] = row;
  } else {
    // nadpisanie tylko jeśli wartość się zmieniła
    if (row[keyIndex] !== value) {
      row[keyIndex] = value;
    }
  }

  // przygotowanie finalnego arkusza
  const otherRows = Object.values(rowMap).filter(r => r[guildIndex] !== guildId);
  const finalRows = [headers, ...otherRows, rowMap[guildId]]; // rowMap[guildId] w tablicy
  await GS.writeConfigSheet(finalRows);
}

// -----------------------------
// CONFIG EXPORTS
// -----------------------------
export async function getConfig(guildId: string): Promise<EventConfig> {
  return await loadConfig(guildId);
}

export async function setConfig(guildId: string, key: string, value: any) {
  await saveConfig(guildId, key, value);
}

export async function setNotificationChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "notificationChannel", channelId);
}

export async function setDownloadChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "downloadChannel", channelId);
}