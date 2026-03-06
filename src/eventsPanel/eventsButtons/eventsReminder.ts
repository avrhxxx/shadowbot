// src/eventsPanel/eventsButtons/eventsReminder.ts
import { TextChannel, Guild, EmbedBuilder } from "discord.js";
import { getEvents, saveEvents, getConfig, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

// co ile sprawdzamy eventy (ms)
const CHECK_INTERVAL = 30_000;

// Mapy intervali, poprawiony typ
let intervalHandles = new Map<string, ReturnType<typeof setInterval>>();

// Rozszerzamy EventObject o pola do reminderów
export interface EventWithReminder extends EventObject {
  reminderSent?: boolean;
  started?: boolean;
}

export async function initEventReminders(guild: Guild) {
  if (intervalHandles.has(guild.id)) return;

  const handle = setInterval(() => checkEvents(guild), CHECK_INTERVAL);
  intervalHandles.set(guild.id, handle);
}

export function stopEventReminders(guildId: string) {
  const handle = intervalHandles.get(guildId);
  if (handle) {
    clearInterval(handle);
    intervalHandles.delete(guildId);
  }
}

async function checkEvents(guild: Guild) {
  const events = await getEvents(guild.id) as EventWithReminder[];
  const now = Date.now();

  for (const event of events) {
    if (event.status !== "ACTIVE") continue;

    const eventTime = getEventDateUTC(event.day, event.month, event.hour, event.minute, event.year).getTime();

    // Reminder
    if (event.reminderBefore !== undefined) {
      const reminderTime = eventTime - event.reminderBefore * 60_000;
      if (!event.reminderSent && now >= reminderTime) {
        const config = await getConfig(guild.id);
        if (!config?.notificationChannelId) continue;

        const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
        if (!channel || !channel.isTextBased()) continue;

        await sendReminderMessage(channel, event);
        event.reminderSent = true;
        await saveEvents(guild.id, events);
      }
    }

    // Event started
    if (!event.started && now >= eventTime) {
      const config = await getConfig(guild.id);
      if (!config?.notificationChannelId) continue;

      const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
      if (!channel || !channel.isTextBased()) continue;

      await sendEventStarted(channel, event, guild);
      event.started = true;
      event.status = "PAST";
      await saveEvents(guild.id, events);
    }
  }
}

export async function sendEventCreatedNotification(event: EventWithReminder, guild: Guild) {
  const config = await getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const eventDateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

  const embed = new EmbedBuilder()
    .setTitle(`🎉 Event Created: ${event.name}`)
    .setDescription(
      `Event scheduled for ${eventDateStr}` +
      (event.reminderBefore !== undefined
        ? `\nReminder set for ${event.reminderBefore} minutes before event start.`
        : "\nNo reminder set.")
    )
    .setColor("Green");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

export async function sendReminderMessage(channel: TextChannel, event: EventWithReminder) {
  const eventDateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

async function sendEventStarted(channel: TextChannel, event: EventWithReminder, guild: Guild) {
  const eventDateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

  const embed = new EmbedBuilder()
    .setTitle(`✅ Event Started: ${event.name}`)
    .setDescription(`The event scheduled for ${eventDateStr} has just started!`)
    .setColor("Blue");

  await channel.send({ content: "@everyone", embeds: [embed] });
}