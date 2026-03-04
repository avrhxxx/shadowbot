import { TextChannel, Guild, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

/**
 * 🔹 Pomocnicza funkcja do pad'owania liczb zerem
 */
function pad(n: number) {
  return n < 10 ? `0${n}` : n;
}

/**
 * 🔹 Mapy timeoutów dla każdego eventu
 */
const reminderTimeouts = new Map<string, NodeJS.Timeout>();
const eventStartTimeouts = new Map<string, NodeJS.Timeout>();

/* ===================================================== */
/*  INICJALIZACJA REMINDERÓW PRZY STARCIU BOTA         */
/* ===================================================== */
export async function initEventReminders(guild: Guild) {
  const events = await EventStorage.getEvents(guild.id);
  const now = new Date();

  for (const event of events) {
    const eventTime = new Date(Date.UTC(
      now.getUTCFullYear(),
      event.month - 1,
      event.day,
      event.hour,
      event.minute
    ));

    // Planowanie tylko dla przyszłych eventów
    if (eventTime.getTime() > now.getTime()) {
      await scheduleEventReminders(event, guild);
    }
  }
}

/* ===================================================== */
/*  POWIADOMIENIE O UTWORZENIU EVENTU                  */
/* ===================================================== */
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

  // Zaplanuj przypomnienia
  await scheduleEventReminders(event, guild);
}

/* ===================================================== */
/*  PLANOWANIE REMINDERÓW I STARTU EVENTU               */
/* ===================================================== */
export async function scheduleEventReminders(event: any, guild: Guild) {
  // Zabezpieczenie przed duplikatem
  if (reminderTimeouts.has(event.id) || eventStartTimeouts.has(event.id)) return;

  const config = await EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const now = new Date();
  const eventTime = new Date(Date.UTC(
    now.getUTCFullYear(),
    event.month - 1,
    event.day,
    event.hour,
    event.minute
  ));

  // 🔹 Reminder przed eventem
  if (event.reminderBefore !== undefined) {
    const reminderTime = eventTime.getTime() - event.reminderBefore * 60_000;
    const delayReminder = reminderTime - now.getTime();

    if (delayReminder > 0) {
      const timeout = setTimeout(() => {
        sendReminderMessage(channel, event);
        reminderTimeouts.delete(event.id);
      }, delayReminder);
      reminderTimeouts.set(event.id, timeout);
    }
  }

  // 🔹 Event start
  const delayStart = eventTime.getTime() - now.getTime();
  if (delayStart > 0) {
    const timeout = setTimeout(async () => {
      await sendEventStarted(channel, event, guild);
      eventStartTimeouts.delete(event.id);
    }, delayStart);
    eventStartTimeouts.set(event.id, timeout);
  }
}

/* ===================================================== */
/*  FUNKCJE WYSYŁAJĄCE WIADOMOŚCI                       */
/* ===================================================== */
export async function sendReminderMessage(channel: TextChannel, event: any) {
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

  // Aktualizacja statusu eventu
  const events = await EventStorage.getEvents(guild.id);
  const e = events.find(ev => ev.id === event.id);
  if (e && e.status !== "PAST") {
    e.status = "PAST";
    await EventStorage.saveEvents(guild.id, events);
  }
}

/* ===================================================== */
/*  OPCJONALNIE — CZYSZCZENIE TIMEOUTÓW                 */
/* ===================================================== */
export function clearEventTimeouts(eventId: string) {
  const rem = reminderTimeouts.get(eventId);
  if (rem) clearTimeout(rem);
  reminderTimeouts.delete(eventId);

  const start = eventStartTimeouts.get(eventId);
  if (start) clearTimeout(start);
  eventStartTimeouts.delete(eventId);
}