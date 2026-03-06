// src/eventsPanel/eventService.ts
import { EmbedBuilder, TextChannel, Guild } from "discord.js";
import { getEvents, saveEvents, getConfig, setConfig } from "./googleSheetsStorage";

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

/* =========================
   EVENT CRUD / HELPERS
========================= */
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

/* =========================
   CONFIG HELPERS
========================= */
export async function setNotificationChannel(guildId: string, channelId: string) {
  const config = await getConfig(guildId);
  config.notificationChannelId = channelId;
  await setConfig(guildId, config);
}

export async function setDownloadChannel(guildId: string, channelId: string) {
  const config = await getConfig(guildId);
  config.downloadChannelId = channelId;
  await setConfig(guildId, config);
}

export async function getDownloadChannel(guildId: string): Promise<string | undefined> {
  const config = await getConfig(guildId);
  return config.downloadChannelId;
}

export async function getConfig(guildId: string) {
  return await getConfig(guildId);
}

export async function saveConfig(guildId: string, config: any) {
  await setConfig(guildId, config);
}

/* =========================
   MANUAL REMINDERS
========================= */
export async function sendManualReminders(guild: Guild) {
  const guildId = guild.id;
  const events = await getActiveEvents(guildId);
  const config = await getConfig(guildId);

  if (!config.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
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

/* =========================
   EMBED GENERATORS
========================= */
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

/* =========================
   FRAGMENTATION HELPERS
========================= */
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

/* =========================
   BUILD REPORT FRAGMENTS
========================= */
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