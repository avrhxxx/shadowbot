import { TextChannel, Guild, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

const CHECK_INTERVAL = 30_000; // co 30 sekund
let intervalHandles = new Map<string, NodeJS.Timer>();

export async function initEventReminders(guild: Guild) {
  // Start cyklicznego checka dla guilda, jeśli jeszcze nie startował
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
  const events = await EventStorage.getEvents(guild.id);
  const now = new Date();

  for (const event of events) {
    if (event.status !== "ACTIVE") continue;

    const eventTime = getEventDateUTC(event.day, event.month, event.hour, event.minute);

    // Reminder
    if (event.reminderBefore !== undefined) {
      const reminderTime = eventTime.getTime() - event.reminderBefore * 60_000;
      if (!event.reminderSent && now.getTime() >= reminderTime) {
        const config = await EventStorage.getConfig(guild.id);
        if (!config?.notificationChannelId) continue;
        const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
        if (!channel || !channel.isTextBased()) continue;
        await sendReminderMessage(channel, event);
        event.reminderSent = true;
        await EventStorage.saveEvents(guild.id, events);
      }
    }

    // Event started
    if (!event.started && now.getTime() >= eventTime.getTime()) {
      const config = await EventStorage.getConfig(guild.id);
      if (!config?.notificationChannelId) continue;
      const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
      if (!channel || !channel.isTextBased()) continue;
      await sendEventStarted(channel, event, guild);
      event.started = true;
      event.status = "PAST";
      await EventStorage.saveEvents(guild.id, events);
    }
  }
}

export async function sendEventCreatedNotification(event: any, guild: Guild) {
  const config = await EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const eventDateStr = formatEventUTC(event.day, event.month, event.hour, event.minute);

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

export async function sendReminderMessage(channel: TextChannel, event: any) {
  const eventDateStr = formatEventUTC(event.day, event.month, event.hour, event.minute);

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

async function sendEventStarted(channel: TextChannel, event: any, guild: Guild) {
  const eventDateStr = formatEventUTC(event.day, event.month, event.hour, event.minute);

  const embed = new EmbedBuilder()
    .setTitle(`✅ Event Started: ${event.name}`)
    .setDescription(`The event scheduled for ${eventDateStr} has just started!`)
    .setColor("Blue");

  await channel.send({ content: "@everyone", embeds: [embed] });
}