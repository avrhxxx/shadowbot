// src/eventsPanel/eventsButtons/eventsReminder.ts
import { TextChannel, Guild, EmbedBuilder, ColorResolvable } from "discord.js";
import { getEvents, saveEvents, getConfig, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

const CHECK_INTERVAL = 30_000;
const intervalHandles = new Map<string, ReturnType<typeof setInterval>>();

// ======================================================
// INIT / STOP REMINDERS
// ======================================================
export async function initEventReminders(guild: Guild) {
  if (intervalHandles.has(guild.id)) return;

  const handle = setInterval(() => checkEvents(guild).catch(console.error), CHECK_INTERVAL);
  intervalHandles.set(guild.id, handle);
}

export function stopEventReminders(guildId: string) {
  const handle = intervalHandles.get(guildId);
  if (handle) {
    clearInterval(handle);
    intervalHandles.delete(guildId);
  }
}

// ======================================================
// CHECK EVENTS
// ======================================================
async function checkEvents(guild: Guild) {
  const events = await getEvents(guild.id);
  const now = Date.now();
  let changed = false;

  const config = await getConfig(guild.id);
  const channel = getTextChannel(guild, config?.notificationChannel);
  if (!channel) return;

  for (const event of events) {
    if (event.status !== "ACTIVE") continue;

    const eventTime = getEventDateUTC(event.day, event.month, event.hour, event.minute, event.year).getTime();
    const reminderTime = eventTime - (event.reminderBefore ?? 60) * 60_000;

    if (!event.reminderSent && now >= reminderTime) {
      await sendEventNotification(
        channel,
        event,
        "⏰ Upcoming Event",
        `Event starts on ${formatEventUTCObj(event)}`,
        "Orange" as ColorResolvable
      );
      event.reminderSent = true;
      changed = true;
    }

    if (!event.started && now >= eventTime) {
      await sendEventNotification(
        channel,
        event,
        "✅ Event Started",
        `The event scheduled for ${formatEventUTCObj(event)} has just started!`,
        "Blue" as ColorResolvable
      );
      event.started = true;
      event.status = "PAST";
      changed = true;
    }
  }

  if (changed) await saveEvents(guild.id, events);
}

// ======================================================
// NOTIFICATIONS HELPERS
// ======================================================
export async function sendEventCreatedNotification(event: EventObject, guild: Guild) {
  const config = await getConfig(guild.id);
  const channel = getTextChannel(guild, config?.notificationChannel);
  if (!channel) return;

  const reminderText = event.reminderBefore !== undefined
    ? `\nReminder set for ${event.reminderBefore} minutes before event start.`
    : "\nReminder set for 60 minutes before event start.";

  await sendEventNotification(
    channel,
    event,
    `🎉 Event Created: ${event.name}`,
    `Event scheduled for ${formatEventUTCObj(event)}${reminderText}`,
    "Green" as ColorResolvable
  );
}

export async function sendReminderMessage(channel: TextChannel, event: EventObject) {
  await sendEventNotification(
    channel,
    event,
    `⏰ Upcoming Event: ${event.name}`,
    `Event starts on ${formatEventUTCObj(event)}`,
    "Orange" as ColorResolvable
  );
}

// ======================================================
// SEND EVENT NOTIFICATION
// ======================================================
async function sendEventNotification(
  channel: TextChannel,
  event: EventObject,
  title: string,
  description: string,
  color: ColorResolvable = "White"
) {
  const eventDate = getEventDateUTC(event.day, event.month, event.hour, event.minute, event.year);

  // Unix timestamp w sekundach
  const eventTimestamp = Math.floor(eventDate.getTime() / 1000);

  // Local Time – tylko godzina:minuta
  const localTime = eventDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `${description}\n\n` +
      `**Game Time (UTC):** ${formatEventUTCObj(event)}\n` +
      `**Local Time:** ${localTime}\n` +
      `**Starts:** <t:${eventTimestamp}:R>`
    )
    .setColor(color);

  await channel.send({ content: "@everyone", embeds: [embed] });
}

// ======================================================
// UTILS
// ======================================================
function getTextChannel(guild: Guild, channelId?: string) {
  if (!channelId) return null;
  const ch = guild.channels.cache.get(channelId);
  return ch && ch.isTextBased() ? (ch as TextChannel) : null;
}

function formatEventUTCObj(event: EventObject) {
  return formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);
}