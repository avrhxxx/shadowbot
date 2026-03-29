// src/eventsPanel/eventsButtons/eventsReminder.ts
import { TextChannel, Guild, EmbedBuilder, ColorResolvable } from "discord.js";
import { getEventById, updateEvent, getConfig, EventObject, getEvents } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

const CHECK_INTERVAL = 60_000;
const intervalHandles = new Map<string, ReturnType<typeof setInterval>>();

// ======================================================
// INIT / STOP REMINDERS
// ======================================================
export async function initEventReminders(guild: Guild) {
  const traceId = createTraceId();

  if (intervalHandles.has(guild.id)) {
    logger.emit({
      scope: "events.reminder",
      event: "already_initialized",
      traceId,
      context: { guildId: guild.id },
    });
    return;
  }

  const handle = setInterval(() => {
    checkEvents(guild).catch((err) => {
      logger.emit({
        scope: "events.reminder",
        event: "interval_failed",
        traceId,
        level: "error",
        error: err,
      });
    });
  }, CHECK_INTERVAL);

  intervalHandles.set(guild.id, handle);

  logger.emit({
    scope: "events.reminder",
    event: "initialized",
    traceId,
    context: { guildId: guild.id },
  });
}

export function stopEventReminders(guildId: string) {
  const traceId = createTraceId();

  const handle = intervalHandles.get(guildId);
  if (handle) {
    clearInterval(handle);
    intervalHandles.delete(guildId);

    logger.emit({
      scope: "events.reminder",
      event: "stopped",
      traceId,
      context: { guildId },
    });
  }
}

// ======================================================
// CHECK EVENTS
// ======================================================
async function checkEvents(guild: Guild) {
  const traceId = createTraceId();

  try {
    const now = new Date();
    const config = await getConfig(guild.id);
    const channel = getTextChannel(guild, config?.notificationChannel);

    if (!channel) {
      logger.emit({
        scope: "events.reminder",
        event: "missing_channel",
        traceId,
        context: { guildId: guild.id },
      });
      return;
    }

    const events = await getEvents(guild.id);

    for (const event of events) {
      if (!event || event.status !== "ACTIVE") continue;

      // ----------------------
      // Birthday
      // ----------------------
      if (event.eventType === "birthdays") {
        const thisYear = now.getUTCFullYear();

        if (
          event.day === now.getUTCDate() &&
          event.month === now.getUTCMonth() + 1 &&
          (event.lastBirthdayYear ?? 0) < thisYear
        ) {
          await sendBirthdayNotification(channel, event);

          await updateEvent(event.id, {
            lastBirthdayYear: thisYear,
          });

          logger.emit({
            scope: "events.reminder",
            event: "birthday_sent",
            traceId,
            context: {
              guildId: guild.id,
              eventId: event.id,
            },
          });
        }

        continue;
      }

      const eventTime = getEventDateUTC(
        event.day,
        event.month,
        event.hour,
        event.minute,
        event.year
      ).getTime();

      const reminderTime =
        eventTime - (event.reminderBefore ?? 60) * 60_000;

      // ----------------------
      // Upcoming
      // ----------------------
      if (!event.reminderSent && now.getTime() >= reminderTime) {
        await sendEventNotification(
          channel,
          event,
          "⏰ Upcoming Event",
          "upcoming",
          "Orange"
        );

        await updateEvent(event.id, {
          reminderSent: true,
        });

        logger.emit({
          scope: "events.reminder",
          event: "reminder_sent",
          traceId,
          context: {
            guildId: guild.id,
            eventId: event.id,
          },
        });
      }

      // ----------------------
      // Started
      // ----------------------
      if (!event.started && now.getTime() >= eventTime) {
        await sendEventNotification(
          channel,
          event,
          "✅ Event Started",
          "started",
          "Blue"
        );

        await updateEvent(event.id, {
          started: true,
          status: "PAST",
        });

        logger.emit({
          scope: "events.reminder",
          event: "event_started",
          traceId,
          context: {
            guildId: guild.id,
            eventId: event.id,
          },
        });
      }
    }

  } catch (err) {
    logger.emit({
      scope: "events.reminder",
      event: "check_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

// ======================================================
// BIRTHDAY
// ======================================================
async function sendBirthdayNotification(
  channel: TextChannel,
  event: EventObject
) {
  const traceId = createTraceId();

  try {
    const embed = new EmbedBuilder()
      .setTitle("🎂 Birthday Celebration!")
      .setDescription(
        `Today is **${event.name}**'s birthday! Let's celebrate together 🎉🍻`
      )
      .setColor(0xffc107);

    await channel.send({
      content: "@everyone",
      embeds: [embed],
    });

  } catch (err) {
    logger.emit({
      scope: "events.reminder",
      event: "birthday_send_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

// ======================================================
// SEND
// ======================================================
export async function sendEventCreatedNotification(
  event: EventObject,
  guild: Guild
) {
  const traceId = createTraceId();

  try {
    const config = await getConfig(guild.id);
    const channel = getTextChannel(guild, config?.notificationChannel);
    if (!channel) return;

    await sendEventNotification(
      channel,
      event,
      "🎉 Event Created",
      "created",
      "Green"
    );

  } catch (err) {
    logger.emit({
      scope: "events.reminder",
      event: "created_notification_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

export async function sendReminderMessage(
  channel: TextChannel,
  event: EventObject
) {
  const traceId = createTraceId();

  try {
    await sendEventNotification(
      channel,
      event,
      "⏰ Upcoming Event",
      "upcoming",
      "Orange"
    );

  } catch (err) {
    logger.emit({
      scope: "events.reminder",
      event: "manual_reminder_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

// ======================================================
// EMBED
// ======================================================
async function sendEventNotification(
  channel: TextChannel,
  event: EventObject,
  title: string,
  type: "created" | "upcoming" | "started",
  color: ColorResolvable = "White"
) {
  const eventDate = getEventDateUTC(
    event.day,
    event.month,
    event.hour,
    event.minute,
    event.year
  );

  const unixTime = Math.floor(eventDate.getTime() / 1000);

  let description =
    `**Game Time:** ${formatEventUTC(
      event.day,
      event.month,
      event.hour,
      event.minute,
      event.year
    )}\n`;

  if (type === "created") {
    description += `Event scheduled <t:${unixTime}:R>`;
  } else if (type === "upcoming") {
    description += `Event starts <t:${unixTime}:R>`;
  } else {
    description += `Event started <t:${unixTime}:R>`;
  }

  description +=
    `\n\n_Click the countdown to see the event time in your local timezone_`;

  const embed = new EmbedBuilder()
    .setTitle(`${title}: ${event.name}`)
    .setDescription(description)
    .setColor(color);

  await channel.send({
    content: "@everyone",
    embeds: [embed],
  });
}

// ======================================================
// UTILS
// ======================================================
function getTextChannel(guild: Guild, channelId?: string) {
  if (!channelId) return null;

  const ch = guild.channels.cache.get(channelId);
  return ch && ch.isTextBased() ? (ch as TextChannel) : null;
}