// src/eventsPanel/eventService.ts
import { EmbedBuilder, TextChannel, Guild } from "discord.js";
import * as GS from "../googleSheetsStorage";

export interface EventObject {
  id: string;
  guildId: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  year?: number;
  reminderBefore?: number;
  status: "ACTIVE" | "PAST" | "CANCELED";
  participants: string[];
  absent: string[];
  createdAt: number;
  reminderSent: boolean;
  started: boolean;
}

export interface EventConfig {
  notificationChannel?: string[];
  downloadChannel?: string[];
  [key: string]: any;
}

// --------------------------
// HELPERS - konwersja arkusz <-> obiekt
// --------------------------
async function loadEvents(guildId: string): Promise<EventObject[]> {
  const rows = await GS.readEventsSheet();
  if (rows.length === 0) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows
    .map(row => {
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = row[i] ?? null));

      obj.participants = obj.participants ? JSON.parse(obj.participants) : [];
      obj.absent = obj.absent ? JSON.parse(obj.absent) : [];
      obj.reminderSent = obj.reminderSent === "true" || obj.reminderSent === true;
      obj.started = obj.started === "true" || obj.started === true;

      return obj as EventObject;
    })
    .filter(e => e.guildId === guildId);
}

async function saveEventsSheet(guildId: string, events: EventObject[]) {
  const rows = await GS.readEventsSheet();
  const headers =
    rows[0] || [
      "id",
      "guildId",
      "name",
      "day",
      "month",
      "hour",
      "minute",
      "year",
      "reminderBefore",
      "status",
      "participants",
      "absent",
      "createdAt",
      "reminderSent",
      "started",
    ];

  const otherRows = rows.slice(1).filter(r => r[1] !== guildId);

  const guildRows = events.map(e => {
    const copy = { ...e };
    copy.participants = JSON.stringify(copy.participants || []);
    copy.absent = JSON.stringify(copy.absent || []);
    copy.reminderSent = copy.reminderSent ? "true" : "false";
    copy.started = copy.started ? "true" : "false";
    return headers.map(h => copy[h] ?? "");
  });

  await GS.writeEventsSheet([headers, ...otherRows, ...guildRows]);
}

// --------------------------
// EVENTS
// --------------------------
export async function getEvents(guildId: string): Promise<EventObject[]> {
  return await loadEvents(guildId);
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  await saveEventsSheet(guildId, events);
}

export async function createEvent(data: {
  guildId: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  year?: number;
  reminderBefore?: number;
}): Promise<EventObject> {
  const newEvent: EventObject = {
    id: `${Date.now()}`,
    ...data,
    status: "ACTIVE",
    participants: [],
    absent: [],
    createdAt: Date.now(),
    reminderSent: false,
    started: false,
  };

  const events = await getEvents(data.guildId);
  events.push(newEvent);
  await saveEvents(data.guildId, events);
  return newEvent;
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
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events.splice(index, 1);
    await saveEvents(guildId, events);
  }
}

// --------------------------
// CONFIG
// --------------------------
async function loadConfig(guildId: string): Promise<EventConfig> {
  const rows = await GS.readConfigSheet();
  if (rows.length === 0) return {};

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const obj: any = {};
  const guildIndex = headers.indexOf("guildId");
  if (guildIndex === -1) return {};

  const row = dataRows.find(r => r[guildIndex] === guildId);
  if (!row) return {};

  headers.forEach((h, i) => {
    if (h === "notificationChannel" || h === "downloadChannel") {
      obj[h] = row[i] ? JSON.parse(row[i]) : [];
    } else {
      obj[h] = row[i] ?? null;
    }
  });

  return obj;
}

async function saveConfig(guildId: string, key: string, value: any) {
  const rows = await GS.readConfigSheet();
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);
  if (keyIndex === -1) throw new Error(`Column ${key} not found: ${key}`);

  let rowIndex = dataRows.findIndex(r => r[guildIndex] === guildId);
  if (rowIndex === -1) {
    const newRow = new Array(headers.length).fill("");
    newRow[guildIndex] = guildId;
    newRow[keyIndex] = typeof value === "object" ? JSON.stringify(value) : value;
    dataRows.push(newRow);
  } else {
    dataRows[rowIndex][keyIndex] = typeof value === "object" ? JSON.stringify(value) : value;
  }

  await GS.writeConfigSheet([headers, ...dataRows]);
}

export async function getConfig(guildId: string): Promise<EventConfig> {
  return await loadConfig(guildId);
}

export async function setConfig(guildId: string, key: string, value: any) {
  await saveConfig(guildId, key, value);
}

// --------------------------
// CHANNEL HELPERS
// --------------------------
export async function setNotificationChannel(guildId: string, channelId: string) {
  const config = await getConfig(guildId);
  config.notificationChannel = [channelId];
  await setConfig(guildId, "notificationChannel", config.notificationChannel);
}

export async function setDownloadChannel(guildId: string, channelId: string) {
  const config = await getConfig(guildId);
  config.downloadChannel = [channelId];
  await setConfig(guildId, "downloadChannel", config.downloadChannel);
}

// --------------------------
// MANUAL REMINDERS
// --------------------------
export async function sendManualReminders(guild: Guild) {
  const guildId = guild.id;
  const events = (await getEvents(guildId)).filter(e => e.status === "ACTIVE");
  const config = await getConfig(guildId);
  if (!config.notificationChannel || config.notificationChannel.length === 0) return;

  const channel = guild.channels.cache.get(config.notificationChannel[0]) as TextChannel;
  if (!channel?.isTextBased()) return;

  for (const event of events) {
    const embed = new EmbedBuilder()
      .setTitle(`Reminder: ${event.name}`)
      .setDescription(
        `Event starts on ${event.day}/${event.month}${event.year ? `/${event.year}` : ""} at ${event.hour}:${event.minute}`
      );
    await channel.send({ embeds: [embed] });
  }
}