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
}

const eventsMap: Record<string, EventObject[]> = {};

export async function getEvents(guildId: string): Promise<EventObject[]> {
  if (!eventsMap[guildId]) eventsMap[guildId] = [];
  return eventsMap[guildId];
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  eventsMap[guildId] = events;
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
  return events.filter(e => e.status === "ACTIVE");
}

export async function getPastEvents(guildId: string): Promise<EventObject[]> {
  const events = await getEvents(guildId);
  return events.filter(e => e.status === "PAST");
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

export async function getConfig(guildId: string): Promise<EventConfig> {
  return await gsGetConfig(guildId);
}

export async function setConfig(guildId: string, key: string, value: string) {
  await gsSetConfig(guildId, key, value);
}

export async function saveConfig(guildId: string, config: EventConfig) {

  for (const key in config) {

    const value = config[key as keyof EventConfig];

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

export async function sendManualReminders(guild: Guild) {

  const guildId = guild.id;

  const events = await getActiveEvents(guildId);

  const config = await getConfig(guildId);

  if (!config.notificationChannel) return;

  const channel = guild.channels.cache.get(config.notificationChannel) as TextChannel;

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