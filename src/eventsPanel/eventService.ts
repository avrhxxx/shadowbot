import { Guild, TextChannel, EmbedBuilder } from "discord.js";
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
      } as EventObject;
    })
    .filter(e => e.guildId === guildId);
}

export async function getEvents(guildId: string): Promise<EventObject[]> {
  return loadEvents(guildId);
}

export async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await loadEvents(guildId);
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

  const idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("Column 'id' not found");

  const rowIndex = rows.findIndex((r: any[]) => r[idIndex] === eventId);
  if (rowIndex === -1) throw new Error(`Event ID ${eventId} not found`);

  await GS.updateEventCell(rowIndex + 1, colIndex + 1, value);
}

// -----------------------------
// REMINDER-SPECIFIC UPDATE
// -----------------------------
export async function checkAndSetReminder(eventId: string, reminderValue: boolean): Promise<boolean> {
  const rows: any[][] = await GS.readEventsSheet();
  if (!rows.length) return false;

  const headers: string[] = rows[0];
  const reminderIndex = headers.indexOf("reminderSent");
  if (reminderIndex === -1) throw new Error("Column 'reminderSent' not found");

  const idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("Column 'id' not found");

  const rowIndex = rows.findIndex((r: any[]) => r[idIndex] === eventId);
  if (rowIndex === -1) return false;

  const currentValue = rows[rowIndex][reminderIndex] === "true";
  if (!currentValue && reminderValue) {
    await GS.updateEventCell(rowIndex + 1, reminderIndex + 1, "true");
  }

  return !currentValue; // true jeśli reminder jeszcze nie był wysłany
}

// -----------------------------
// OTHER OPERATIONS (PARTICIPANTS, STATUS, CREATE, DELETE)
// -----------------------------
export async function addParticipants(guildId: string, eventId: string, nicknames: string[]) { /* ...jak wcześniej */ }
export async function removeParticipants(guildId: string, eventId: string, nicknames: string[]) { /* ...jak wcześniej */ }
export async function markAbsent(guildId: string, eventId: string, nicknames: string[]) { /* ...jak wcześniej */ }
export async function cancelEvent(guildId: string, eventId: string): Promise<EventObject | null> { /* ...jak wcześniej */ }
export async function deleteEvent(eventId: string) { /* ...jak wcześniej */ }
export async function createEvent(data: EventObject): Promise<EventObject> { /* ...jak wcześniej */ }
export async function saveEvents(guildId: string, events: EventObject[]) { /* ...jak wcześniej */ }

// -----------------------------
// CONFIG
// -----------------------------
export async function getConfig(guildId: string): Promise<EventConfig> { /* ...jak wcześniej */ }
export async function setConfig(guildId: string, key: string, value: any) { /* ...jak wcześniej */ }
export async function setNotificationChannel(guildId: string, channelId: string) { await setConfig(guildId,"notificationChannel",channelId) }
export async function setDownloadChannel(guildId: string, channelId: string) { await setConfig(guildId,"downloadChannel",channelId) }

// -----------------------------
// EXPORT ALL
// -----------------------------
export {
  loadEvents,
  getEvents,
  getEventById,
  updateEventCell,
  checkAndSetReminder,
  addParticipants,
  removeParticipants,
  markAbsent,
  cancelEvent,
  deleteEvent,
  createEvent,
  saveEvents,
  getConfig,
  setConfig,
  setNotificationChannel,
  setDownloadChannel
};