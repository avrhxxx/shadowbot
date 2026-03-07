import { EmbedBuilder, TextChannel, Guild } from "discord.js";
import * as GS from "./googleSheetsStorage";

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
// EVENTS
// --------------------------
export async function getEvents(guildId: string): Promise<EventObject[]> {
  return await GS.getEvents(guildId);
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  // ⚠️ Zapisujemy całą listę do cache + arkusz tylko jeśli lista jest kompletna
  await GS.saveEvents(guildId, events);
}

// --------------------------
// CREATE / CANCEL / FIND
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

  // zapisujemy tylko nowy event w arkuszu, nie całą listę
  await saveEventToSheets(newEvent);

  // aktualizacja cache: pobieramy istniejące, dodajemy nowy
  const events = await getEvents(data.guildId);
  events.push(newEvent);
  await GS.saveEvents(data.guildId, events); // zapis cache + lista w arkuszu

  return newEvent;
}

export async function saveEventToSheets(event: EventObject) {
  const existingEvent = await GS.getEventById(event.guildId, event.id);
  if (existingEvent) {
    // aktualizacja w arkuszu tylko tego eventu
    const events = await getEvents(event.guildId);
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
      events[index] = event;
      await GS.saveEvents(event.guildId, events); // zapis całej listy w arkuszu
    }
  } else {
    // zapis nowego eventu w arkuszu
    const events = await getEvents(event.guildId);
    events.push(event);
    await GS.saveEvents(event.guildId, events);
  }
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
  await saveEventToSheets(event); // aktualizacja tylko tego eventu
  return event;
}

// --------------------------
// CONFIG
// --------------------------
export async function getConfig(guildId: string): Promise<EventConfig> {
  return await GS.getConfig(guildId);
}

export async function setConfig(guildId: string, key: string, value: string) {
  await GS.setConfig(guildId, key, value);
}

export async function saveConfig(guildId: string, config: EventConfig) {
  for (const key in config) {
    const value = config[key];
    if (value !== undefined) await setConfig(guildId, key, String(value));
  }
}

// --------------------------
// CHANNEL HELPERS
// --------------------------
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

// --------------------------
// MANUAL REMINDERS
// --------------------------
export async function sendManualReminders(guild: Guild) {
  const guildId = guild.id;
  const events = (await getEvents(guildId)).filter(e => e.status === "ACTIVE");
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