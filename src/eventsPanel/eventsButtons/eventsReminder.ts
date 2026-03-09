import { TextChannel, Guild, EmbedBuilder, ColorResolvable } from "discord.js";
import { getEvents, saveEvents, EventObject, getConfig } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

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
  let changed = false;

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
        changed = true;
      }
      continue;
    }
  }

  if (changed) await saveEvents(guild.id, events);
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
// SEND REMINDER MANUALLY (STANDARD EVENTS)
// ======================================================
export async function sendReminderMessage(channel: TextChannel, event: EventObject) {
  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Date: ${formatEventUTC(event.day, event.month, event.hour, event.minute, event.year)}`)
    .setColor("Orange");

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