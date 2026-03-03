// src/eventsPanel/eventService.ts
import * as EventStorage from "./eventStorage";
import { EmbedBuilder, TextChannel } from "discord.js";

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
}

/**
 * Tworzy nowy event i zapisuje do storage
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
 * Ustawia kanał globalny do przypomnień
 */
export async function setGlobalChannel(guildId: string, channelId: string) {
  const config = await EventStorage.getConfig(guildId);
  config.defaultChannelId = channelId;
  await EventStorage.saveConfig(guildId, config);
}

/**
 * Wysyła ręczne przypomnienia o aktywnych eventach
 */
export async function sendManualReminders(guild: any) {
  const guildId = guild.id;
  const events = await EventStorage.getEvents(guildId);
  const activeEvents = events.filter(e => e.status === "ACTIVE");
  const config = await EventStorage.getConfig(guildId);

  if (!config.defaultChannelId) return;

  const channel = guild.channels.cache.get(config.defaultChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  for (const event of activeEvents) {
    const embed = new EmbedBuilder()
      .setTitle(`Reminder: ${event.name}`)
      .setDescription(`Event starts on ${event.day}/${event.month} at ${event.hour}:${event.minute}`);
    await channel.send({ embeds: [embed] });
  }
}

/**
 * Pobiera listę eventów w formie embed
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
 * Pobiera uczestników eventu (do download)
 */
export async function getPastEvents(guildId: string) {
  const events = await EventStorage.getEvents(guildId);
  return events.filter(e => e.status === "PAST");
}