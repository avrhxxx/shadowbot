// src/eventsPanel/eventService.ts
import * as EventStorage from "./eventStorage";
import { EmbedBuilder, TextChannel } from "discord.js";

/**
 * Interfejs eventu
 */
export interface EventObject {
  id: string;
  guildId: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderBefore: number;
  status: "ACTIVE" | "PAST" | "CANCELLED";
  participants: string[];
  createdAt: number;
  // opcjonalnie absent dla oznaczonych nieobecnych
  absent?: string[];
}

/**
 * Tworzy nowy event i zapisuje go w storage
 */
export async function createEvent(data: {
  guildId: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderBefore: number;
}): Promise<EventObject> {
  const events = await EventStorage.getEvents(data.guildId);

  const newEvent: EventObject = {
    id: `${Date.now()}`,
    ...data,
    status: "ACTIVE",
    participants: [],
    createdAt: Date.now()
  };

  events.push(newEvent);
  await EventStorage.saveEvents(data.guildId, events);
  return newEvent;
}

/**
 * Pobiera wszystkie eventy
 */
export async function getEvents(guildId: string): Promise<EventObject[]> {
  return await EventStorage.getEvents(guildId);
}

/**
 * Pobiera aktywne eventy
 */
export async function getActiveEvents(guildId: string): Promise<EventObject[]> {
  const events = await EventStorage.getEvents(guildId);
  return events.filter(e => e.status === "ACTIVE");
}

/**
 * Pobiera pojedynczy event po ID
 */
export async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await EventStorage.getEvents(guildId);
  return events.find(e => e.id === eventId) || null;
}

/**
 * Pobiera przeszłe (PAST) eventy
 */
export async function getPastEvents(guildId: string): Promise<EventObject[]> {
  const events = await EventStorage.getEvents(guildId);
  return events.filter(e => e.status === "PAST");
}

/**
 * Anuluje event o danym ID
 */
export async function cancelEvent(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  event.status = "CANCELLED";
  await EventStorage.saveEvents(guildId, events);
  return event;
}

/**
 * Ustawia globalny kanał do przypomnień
 */
export async function setGlobalChannel(guildId: string, channelId: string) {
  const config = await EventStorage.getConfig(guildId);
  config.defaultChannelId = channelId;
  await EventStorage.saveConfig(guildId, config);
}

/**
 * Ustawia kanał do downloadu plików z uczestnikami
 */
export async function setDownloadChannel(guildId: string, channelId: string) {
  const config = await EventStorage.getConfig(guildId);
  config.downloadChannelId = channelId;
  await EventStorage.saveConfig(guildId, config);
}

/**
 * Pobiera kanał do downloadu
 */
export async function getDownloadChannel(guildId: string): Promise<string | undefined> {
  const config = await EventStorage.getConfig(guildId);
  return config.downloadChannelId;
}

/**
 * Wysyła ręczne przypomnienia o aktywnych eventach
 */
export async function sendManualReminders(guild: any) {
  const guildId = guild.id;
  const events = await getActiveEvents(guildId);
  const config = await EventStorage.getConfig(guildId);

  if (!config.defaultChannelId) return;

  const channel = guild.channels.cache.get(config.defaultChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  for (const event of events) {
    const embed = new EmbedBuilder()
      .setTitle(`Reminder: ${event.name}`)
      .setDescription(`Event starts on ${event.day}/${event.month} at ${event.hour}:${event.minute}`);
    await channel.send({ embeds: [embed] });
  }
}

/**
 * Generuje embed listy eventów w skróconej formie
 */
export function generateEventListEmbed(events: EventObject[]) {
  return new EmbedBuilder()
    .setTitle("Event List")
    .setDescription(
      events.length === 0
        ? "No events found."
        : events.map(e => `• ${e.name} (${e.status})`).join("\n")
    );
}

/**
 * Generuje szczegółowe embedy dla listy eventów
 * Uwzględnia liczbę uczestników i nieobecnych
 */
export function generateEventListEmbedDetailed(events: EventObject[]) {
  return events.map(e => {
    return new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(
        `Status: ${e.status}\nParticipants: ${e.participants.length}${e.absent?.length ? `\nAbsent: ${e.absent.length}` : ""}`
      )
      .setColor(e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000);
  });
}