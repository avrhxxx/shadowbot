import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  TextChannel,
  Guild
} from "discord.js";
import * as EventStorage from "../eventStorage";

function pad(n: number) {
  return n < 10 ? `0${n}` : n;
}

const reminderTimeouts = new Map<string, NodeJS.Timeout>();
const eventStartTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * 🔹 Powiadomienie po stworzeniu eventu
 */
export async function sendEventCreatedNotification(event: any, guild: Guild) {
  const config = await EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`🎉 Event Created: ${event.name}`)
    .setDescription(
      `Event scheduled for ${eventDateStr}` +
        (event.reminderBefore !== undefined
          ? `\nReminder set ${event.reminderBefore} minutes before.`
          : "\nNo reminder set.")
    )
    .setColor("Green");

  await channel.send({ content: "@everyone", embeds: [embed] });

  // 🔹 TYLKO TU planujemy timeout
  await scheduleEventReminders(event, guild);
}

/**
 * 🔹 Zaplanuj przypomnienia dla pojedynczego eventu
 */
export async function scheduleEventReminders(event: any, guild: Guild) {
  // 🔴 ZABEZPIECZENIE PRZED DUPLIKATEM
  if (reminderTimeouts.has(event.id) || eventStartTimeouts.has(event.id)) {
    return;
  }

  const config = await EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const nowUTC = new Date();
  const year = nowUTC.getUTCFullYear();
  const eventTime = new Date(
    Date.UTC(year, event.month - 1, event.day, event.hour, event.minute)
  );

  // 🔹 Reminder przed eventem
  if (event.reminderBefore !== undefined) {
    const reminderTime =
      eventTime.getTime() - event.reminderBefore * 60 * 1000;
    const delayReminder = reminderTime - nowUTC.getTime();

    if (delayReminder > 0) {
      const timeout = setTimeout(() => {
        sendReminderMessage(channel, event);
        reminderTimeouts.delete(event.id);
      }, delayReminder);

      reminderTimeouts.set(event.id, timeout);
    }
  }

  // 🔹 Event Started
  const delayStart = eventTime.getTime() - nowUTC.getTime();

  if (delayStart > 0) {
    const timeout = setTimeout(async () => {
      await sendEventStarted(channel, event, guild);
      eventStartTimeouts.delete(event.id);
    }, delayStart);

    eventStartTimeouts.set(event.id, timeout);
  }
}

async function sendReminderMessage(channel: TextChannel, event: any) {
  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

async function sendEventStarted(channel: TextChannel, event: any, guild: Guild) {
  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`✅ Event Started: ${event.name}`)
    .setDescription(`The event scheduled for ${eventDateStr} has just started!`)
    .setColor("Blue");

  await channel.send({ content: "@everyone", embeds: [embed] });

  const events = await EventStorage.getEvents(guild.id);
  const e = events.find(ev => ev.id === event.id);

  if (e && e.status !== "PAST") {
    e.status = "PAST";
    await EventStorage.saveEvents(guild.id, events);
  }
}