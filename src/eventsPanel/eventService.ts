// src/eventsPanel/eventService.ts
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

// -----------------------------
// UPDATE / DELETE EVENT CELLS
// -----------------------------
export async function updateEventCell(eventId: string, columnName: string, value: any) {
  const rows = await GS.readEventsSheet();
  if (!rows.length) return;

  const headers = rows[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error(`Column ${columnName} not found`);

  const rowIndex = rows.findIndex(r => r[0] === eventId);
  if (rowIndex === -1) throw new Error(`Event ID ${eventId} not found`);

  await GS.updateEventCell(rowIndex + 1, colIndex + 1, value); // 1-indexed dla Sheets
}

export async function deleteEventRow(eventId: string) {
  const rows = await GS.readEventsSheet();
  if (!rows.length) return;

  const rowIndex = rows.findIndex(r => r[0] === eventId);
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
  const rows = await GS.readEventsSheet();
  const headers = rows[0] || [
    "id","guildId","name","day","month","hour","minute","year","reminderBefore","status",
    "participants","absent","createdAt","reminderSent","started"
  ];

  const dataRows = rows.slice(1);
  const guildIndex = 1;

  const rowMap: Record<string, any[]> = {};
  dataRows.forEach(r => { if(r[guildIndex] === guildId) rowMap[r[0]] = r; });

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

  const otherRows = dataRows.filter(r => r[guildIndex] !== guildId);
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
  const rows = await GS.readConfigSheet();
  if (!rows.length) return {};
  const headers = rows[0] || ["guildId","notificationChannel","downloadChannel"];
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
  let dataRows = rows.slice(1);

  if (!headers.includes(key)) {
    headers.push(key);
    dataRows = dataRows.map(r => { while(r.length < headers.length) r.push(""); return r; });
  }

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);

  let row = dataRows.find(r => r[guildIndex] === guildId);
  let rowIndex: number;

  if (!row) {
    row = new Array(headers.length).fill("");
    row[guildIndex] = guildId;
    dataRows.push(row);
    rowIndex = dataRows.length; // +1 dla nagłówka
  } else {
    rowIndex = dataRows.indexOf(row) + 1;
  }

  await GS.updateConfigCell(rowIndex, keyIndex + 1, value);
}

export async function setNotificationChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "notificationChannel", channelId);
}

export async function setDownloadChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "downloadChannel", channelId);
}