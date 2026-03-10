import { TextChannel, Guild, EmbedBuilder, ColorResolvable } from "discord.js";
import { checkAndSetReminder, getEvents, getConfig, EventObject } from "../eventService";
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
  const events = await getEvents(guild.id);
  const now = new Date();

  const config = await getConfig(guild.id);
  const channel = getTextChannel(guild, config?.notificationChannel);
  if (!channel) return;

  for (const event of events) {
    if (event.status !== "ACTIVE") continue;

    // ----------------------
    // Birthday special case
    // ----------------------
    if (event.eventType === "birthdays") {
      if (
        event.day === now.getUTCDate() &&
        event.month === now.getUTCMonth() + 1 &&
        (event.lastBirthdayYear ?? 0) < now.getUTCFullYear()
      ) {
        await sendBirthdayNotification(channel, event);
        event.lastBirthdayYear = now.getUTCFullYear();
      }
      continue;
    }

    const eventTime = getEventDateUTC(event.day, event.month, event.hour, event.minute, event.year).getTime();
    const reminderTime = eventTime - (event.reminderBefore ?? 60) * 60_000;

    // Upcoming reminder
    if (now.getTime() >= reminderTime) {
      const shouldSend = await checkAndSetReminder(event.id, true);
      if (shouldSend) {
        await sendEventNotification(channel, event, "⏰ Upcoming Event", "upcoming", "Orange");
      }
    }

    // Event started
    if (!event.started && now.getTime() >= eventTime) {
      await sendEventNotification(channel, event, "✅ Event Started", "started", "Blue");
      event.started = true;
      event.status = "PAST";
    }
  }
}

// ======================================================
// SEND BIRTHDAY NOTIFICATION (SPECIAL)
// ======================================================
async function sendBirthdayNotification(channel: TextChannel, event: EventObject) {
  const embed = new EmbedBuilder()
    .setTitle("🎂 Birthday Celebration!")
    .setDescription(`Today is **${event.name}**'s birthday! Let's celebrate together 🎉🍻`)
    .setColor(0xffc107);

  await channel.send({ content: "@everyone", embeds: [embed] });
}

// ======================================================
// SEND EVENT NOTIFICATION (UNIFIED SCHEME)
// ======================================================
async function sendEventNotification(
  channel: TextChannel,
  event: EventObject,
  title: string,
  type: "created" | "upcoming" | "started",
  color: ColorResolvable = "White"
) {
  const eventDate = getEventDateUTC(event.day, event.month, event.hour, event.minute, event.year);
  const unixTime = Math.floor(eventDate.getTime() / 1000);

  let description = `**Game Time:** ${formatEventUTC(event.day, event.month, event.hour, event.minute, event.year)}\n`;
  if (type === "created") description += `Event scheduled <t:${unixTime}:R>`;
  else if (type === "upcoming") description += `Event starts <t:${unixTime}:R>`;
  else if (type === "started") description += `Event started <t:${unixTime}:R>`;
  description += `\n\n_Click the countdown to see the event time in your local timezone_`;

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