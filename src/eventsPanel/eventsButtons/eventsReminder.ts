import { TextChannel, Guild, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { getEventDateUTC, formatUTCDate } from "../../utils/timeUtils";

const reminderSent = new Set<string>();
const eventStarted = new Set<string>();

/* ===================================================== */
/*  GŁÓWNY SCHEDULER (sprawdza eventy co 30 sekund)      */
/* ===================================================== */

let schedulerStarted = false;

export function startEventScheduler(guild: Guild) {

  if (schedulerStarted) return;
  schedulerStarted = true;

  setInterval(async () => {

    const events = await EventStorage.getEvents(guild.id);
    const now = new Date();

    const config = await EventStorage.getConfig(guild.id);
    if (!config?.notificationChannelId) return;

    const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
    if (!channel || !channel.isTextBased()) return;

    for (const event of events) {

      if (event.status !== "ACTIVE") continue;

      const eventTime = getEventDateUTC(
        event.day,
        event.month,
        event.hour,
        event.minute
      );

      const timeToEvent = eventTime.getTime() - now.getTime();

      /* ================= REMINDER ================= */

      if (event.reminderBefore !== undefined) {

        const reminderTime = eventTime.getTime() - event.reminderBefore * 60_000;
        const timeToReminder = reminderTime - now.getTime();

        if (timeToReminder <= 0 && !reminderSent.has(event.id)) {

          await sendReminderMessage(channel, event);
          reminderSent.add(event.id);

        }
      }

      /* ================= EVENT START ================= */

      if (timeToEvent <= 0 && !eventStarted.has(event.id)) {

        await sendEventStarted(channel, event, guild);
        eventStarted.add(event.id);

      }

    }

  }, 30_000); // sprawdzanie co 30s
}

/* ===================================================== */
/*  INIT PRZY STARCIE BOTA                               */
/* ===================================================== */

export async function initEventReminders(guild: Guild) {

  startEventScheduler(guild);

}

/* ===================================================== */
/*  EVENT CREATED                                        */
/* ===================================================== */

export async function sendEventCreatedNotification(event: any, guild: Guild) {

  const config = await EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const eventDateStr = formatUTCDate(
    event.day,
    event.month,
    event.hour,
    event.minute
  );

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

/* ===================================================== */
/*  REMINDER MESSAGE                                     */
/* ===================================================== */

export async function sendReminderMessage(channel: TextChannel, event: any) {

  const eventDateStr = formatUTCDate(
    event.day,
    event.month,
    event.hour,
    event.minute
  );

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  await channel.send({ content: "@everyone", embeds: [embed] });

}

/* ===================================================== */
/*  EVENT STARTED                                        */
/* ===================================================== */

async function sendEventStarted(channel: TextChannel, event: any, guild: Guild) {

  const eventDateStr = formatUTCDate(
    event.day,
    event.month,
    event.hour,
    event.minute
  );

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

/* ===================================================== */
/*  RESET (opcjonalnie)                                  */
/* ===================================================== */

export function resetEventCache() {

  reminderSent.clear();
  eventStarted.clear();

}