// src/eventsPanel/eventService.ts
import { EmbedBuilder, TextChannel, Guild } from "discord.js";
import { getConfig as gsGetConfig, setConfig as gsSetConfig } from "./googleSheetsStorage";

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
  absent?: string[];
  createdAt: number;
  reminderSent?: boolean;
  started?: boolean;
}

export interface EventConfig {
  notificationChannel?: string;
  downloadChannel?: string;
  [key: string]: any;
}

// --------------------------
// LOCAL EVENT STORAGE
// --------------------------
const eventsMap: Record<string, EventObject[]> = {};

export async function getEvents(guildId: string): Promise<EventObject[]> {
  if (!eventsMap[guildId]) eventsMap[guildId] = [];
  return eventsMap[guildId];
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  eventsMap[guildId] = events;
}

// --------------------------
// EVENT HELPERS
// --------------------------
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
  const events = await getEvents(data.guildId);

  const newEvent: EventObject = {
    id: `${Date.now()}`,
    ...data,
    status: "ACTIVE",
    participants: [],
    absent: [],
    createdAt: Date.now(),
    reminderSent: false,
    started: false
  };

  events.push(newEvent);
  await saveEvents(data.guildId, events);
  return newEvent;
}

export async function getActiveEvents(guildId: string): Promise<EventObject[]> {
  const events = await getEvents(guildId);
  return events.filter((e: EventObject) => e.status === "ACTIVE");
}

export async function getPastEvents(guildId: string): Promise<EventObject[]> {
  const events = await getEvents(guildId);
  return events.filter((e: EventObject) => e.status === "PAST");
}

export async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find((e: EventObject) => e.id === eventId) || null;
}

export async function cancelEvent(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  const event = events.find((e: EventObject) => e.id === eventId);
  if (!event) return null;

  event.status = "CANCELED";
  await saveEvents(guildId, events);
  return event;
}

// --------------------------
// CONFIG HELPERS
// --------------------------
export async function getConfig(guildId: string): Promise<EventConfig> {
  return await gsGetConfig(guildId);
}

export async function setConfig(guildId: string, key: string, value: string) {
  await gsSetConfig(guildId, key, value);
}

// wrapper, żeby zapisać cały obiekt config
export async function saveConfig(guildId: string, config: EventConfig) {
  for (const key in config) {
    const value = config[key];
    if (value !== undefined) {
      await setConfig(guildId, key, String(value));
    }
  }
}

export async function setNotificationChannel(guildId: string, channelId: string) {
  const config = await getConfig(guildId);
  config.notificationChannel = channelId;
  await saveConfig(guildId, config);
}

export async function setDownloadChannel(guildId: string, channelId: string) {
  const config = await getConfig(guildId);
  config.downloadChannel = channelId;
  await saveConfig(guildId, config);
}

export async function getDownloadChannel(guildId: string): Promise<string | undefined> {
  const config = await getConfig(guildId);
  return config.downloadChannel;
}

// --------------------------
// MANUAL REMINDERS
// --------------------------
export async function sendManualReminders(guild: Guild) {
  const guildId = guild.id;
  const events = await getActiveEvents(guildId);
  const config = await getConfig(guildId);

  if (!config.notificationChannel) return;

  const channel = guild.channels.cache.get(config.notificationChannel) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  for (const event of events) {
    const embed = new EmbedBuilder()
      .setTitle(`Reminder: ${event.name}`)
      .setDescription(
        `Event starts on ${event.day}/${event.month}${event.year ? `/${event.year}` : ""} at ${event.hour}:${event.minute}`
      );

    await channel.send({ embeds: [embed] });
  }
}

// --------------------------
// EMBED GENERATORS
// --------------------------
export function generateEventListEmbed(events: EventObject[]) {
  return new EmbedBuilder()
    .setTitle("Event List")
    .setDescription(
      events.length === 0
        ? "No events found."
        : events.map((e: EventObject) => `• ${e.name} (${e.status})`).join("\n")
    );
}

export function generateEventListEmbedDetailed(events: EventObject[]) {
  return events.map((e: EventObject) =>
    new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(
        `Status: ${e.status}\nParticipants: ${e.participants.length}${e.absent?.length ? `\nAbsent: ${e.absent.length}` : ""}`
      )
      .setColor(
        e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000
      )
  );
}

// --------------------------
// BUILD REPORT
// --------------------------
export function buildReportFragments(events: EventObject[], guild: Guild) {
  const participantsSet = new Set<string>();
  events.forEach((ev: EventObject) => {
    ev.participants.forEach(p => participantsSet.add(p));
    (ev.absent || []).forEach(a => participantsSet.add(a));
  });

  const participants = [...participantsSet];
  let embedText = '';
  let txtText = '';

  participants.forEach(memberId => {
    const name = guild.members.cache.get(memberId)?.displayName || memberId;
    let attended = 0;
    let block: string[] = [];

    events.forEach((ev: EventObject) => {
      let status = '-';
      if (ev.participants.includes(memberId)) status = '✓';
      else if (ev.absent?.includes(memberId)) status = '✗';
      if (status === '✓') attended++;
      block.push(`${ev.name}  ${status}`);
    });

    const percent = Math.round((attended / events.length) * 100);
    const line = `${name}\n${block.join('\n')}\nAttendance: ${attended}/${events.length} (${percent}%)\n\n----------------------\n\n`;

    embedText += line;
    txtText += line;
  });

  const embedChunks = chunkEventEmbedDescription(embedText);
  const txtChunks = chunkTextFile(txtText);

  return { embedChunks, txtChunks };
}

export function chunkEventEmbedDescription(description: string, maxChars = 6000): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < description.length) {
    chunks.push(description.slice(start, start + maxChars));
    start += maxChars;
  }
  return chunks;
}

export function chunkTextFile(content: string, maxChars = 1900000): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < content.length) {
    chunks.push(content.slice(start, start + maxChars));
    start += maxChars;
  }
  return chunks;
}