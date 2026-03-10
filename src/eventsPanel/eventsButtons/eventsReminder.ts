import { TextChannel, Guild, EmbedBuilder, ColorResolvable } from "discord.js";
import { getEventById, checkAndSetReminder, getAllEventIdsFromService, getConfig, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

const CHECK_INTERVAL = 60_000; // 60s
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
  const now = new Date();
  const config = await getConfig(guild.id);
  const channel = getTextChannel(guild, config?.notificationChannel);
  if (!channel) return;

  const allEventIds = await getAllEventIdsFromService(guild.id);

  for (const eventId of allEventIds) {
    const shouldSendReminder = await checkAndSetReminder(eventId, true);
    if (!shouldSendReminder) continue;

    const event = await getEventById(guild.id, eventId);
    if (!event || event.status !== "ACTIVE") continue;

    // ----------------------
    // Birthday special case
    // ----------------------
    if (event.eventType === "birthdays") {
      const thisYear = now.getUTCFullYear();
      if (event.day === now.getUTCDate() && event.month === now.getUTCMonth() + 1 && (event.lastBirthdayYear ?? 0) < thisYear) {
        await sendBirthdayNotification(channel, event);
      }
      continue;
    }

    // ----------------------
    // Upcoming reminder
    // ----------------------
    await sendReminderMessage(channel, event);
  }
}

// ======================================================
// SEND BIRTHDAY NOTIFICATION
// ======================================================
async function sendBirthdayNotification(channel: TextChannel, event: EventObject) {
  const embed = new EmbedBuilder()
    .setTitle("🎂 Birthday Celebration!")
    .setDescription(`Today is **${event.name}**'s birthday! Let's celebrate together 🎉🍻`)
    .setColor(0xffc107);

  await channel.send({ content: "@everyone", embeds: [embed] });
}

// ======================================================
// SEND REMINDERS / CREATED
// ======================================================
export async function sendEventCreatedNotification(event: EventObject, guild: Guild) {
  const config = await getConfig(guild.id);
  const channel = getTextChannel(guild, config?.notificationChannel);
  if (!channel) return;
  await sendEventNotification(channel, event, "🎉 Event Created", "created", "Green");
}

export async function sendReminderMessage(channel: TextChannel, event: EventObject) {
  await sendEventNotification(channel, event, "⏰ Upcoming Event", "upcoming", "Orange");
}

// ======================================================
// SEND EVENT NOTIFICATION (UNIFIED SCHEME)
// ======================================================
async function sendEventNotification(channel: TextChannel, event: EventObject, title: string, type: "created" | "upcoming", color: ColorResolvable = "White") {
  const eventDate = getEventDateUTC(event.day, event.month, event.hour, event.minute, event.year);
  const unixTime = Math.floor(eventDate.getTime() / 1000);
  const description = `${type === "created" ? "Event scheduled" : "Event starts"} <t:${unixTime}:R>\n\n_Click the countdown to see the event time in your local timezone_`;

  const embed = new EmbedBuilder()
    .setTitle(`${title}: ${event.name}`)
    .setDescription(description)
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

// ======================================================
// EXPORTS
// ======================================================
export { sendEventCreatedNotification, sendReminderMessage, initEventReminders, stopEventReminders };