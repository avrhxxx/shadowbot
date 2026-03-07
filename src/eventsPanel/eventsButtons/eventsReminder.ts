// src/eventsPanel/eventsButtons/eventsReminder.ts
import { TextChannel, Guild, EmbedBuilder } from "discord.js";
import { getEvents, saveEvents, getConfig, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

const CHECK_INTERVAL = 30_000;

let intervalHandles = new Map<string, ReturnType<typeof setInterval>>();

/* ----------------------
   INIT / STOP REMINDERS
----------------------- */
export async function initEventReminders(guild: Guild) {
  if (intervalHandles.has(guild.id)) return;

  const handle = setInterval(() => {
    checkEvents(guild).catch(console.error);
  }, CHECK_INTERVAL);

  intervalHandles.set(guild.id, handle);
}

export function stopEventReminders(guildId: string) {
  const handle = intervalHandles.get(guildId);
  if (handle) {
    clearInterval(handle);
    intervalHandles.delete(guildId);
  }
}

/* ----------------------
   CHECK EVENTS
----------------------- */
async function checkEvents(guild: Guild) {
  const events = await getEvents(guild.id);
  const now = Date.now();
  let changed = false;

  const config = await getConfig(guild.id);
  const channelId = config.notificationChannel;
  if (!channelId) return;

  const rawChannel = guild.channels.cache.get(channelId);
  if (!rawChannel || !rawChannel.isTextBased()) return;

  const channel = rawChannel as TextChannel;

  for (const event of events) {
    if (event.status !== "ACTIVE") continue;

    const eventTime = getEventDateUTC(
      event.day,
      event.month,
      event.hour,
      event.minute,
      event.year
    ).getTime();

    // reminder
    const reminderMinutes = event.reminderBefore ?? 60; // domyślnie 1h
    const reminderTime = eventTime - reminderMinutes * 60_000;

    if (!event.reminderSent && now >= reminderTime) {
      await sendReminderMessage(channel, event);
      event.reminderSent = true;
      changed = true;
    }

    // event start
    if (!event.started && now >= eventTime) {
      await sendEventStarted(channel, event);
      event.started = true;
      event.status = "PAST";
      changed = true;
    }
  }

  if (changed) {
    await saveEvents(guild.id, events);
  }
}

/* ----------------------
   NOTIFICATIONS
----------------------- */
export async function sendEventCreatedNotification(event: EventObject, guild: Guild) {
  const config = await getConfig(guild.id);
  const channelId = config.notificationChannel;
  if (!channelId) return;

  const rawChannel = guild.channels.cache.get(channelId);
  if (!rawChannel || !rawChannel.isTextBased()) return;

  const channel = rawChannel as TextChannel;

  const eventDateStr = formatEventUTC(
    event.day,
    event.month,
    event.hour,
    event.minute,
    event.year
  );

  const reminderText =
    event.reminderBefore !== undefined
      ? `\nReminder set for ${event.reminderBefore} minutes before event start.`
      : "\nReminder set for 60 minutes before event start.";

  const embed = new EmbedBuilder()
    .setTitle(`🎉 Event Created: ${event.name}`)
    .setDescription(`Event scheduled for ${eventDateStr}${reminderText}`)
    .setColor("Green");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

export async function sendReminderMessage(channel: TextChannel, event: EventObject) {
  const eventDateStr = formatEventUTC(
    event.day,
    event.month,
    event.hour,
    event.minute,
    event.year
  );

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

async function sendEventStarted(channel: TextChannel, event: EventObject) {
  const eventDateStr = formatEventUTC(
    event.day,
    event.month,
    event.hour,
    event.minute,
    event.year
  );

  const embed = new EmbedBuilder()
    .setTitle(`✅ Event Started: ${event.name}`)
    .setDescription(`The event scheduled for ${eventDateStr} has just started!`)
    .setColor("Blue");

  await channel.send({ content: "@everyone", embeds: [embed] });
}