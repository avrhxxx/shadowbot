// src/system/events/eventsButtons/eventsManualReminder.ts

import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  TextChannel
} from "discord.js";
import { getEvents, EventObject, getConfig } from "../eventService";
import { sendReminderMessage } from "./eventsReminder";
import { formatEventUTC } from "../../utils/timeUtils";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

/* ======================================================
   HELPERS
====================================================== */
function createEventSelectMenu(events: EventObject[], customId: string, placeholder: string) {
  const uniqueEvents = Array.from(new Map(events.map(e => [e.id, e])).values());

  const options = uniqueEvents.map(ev =>
    new StringSelectMenuOptionBuilder()
      .setLabel(ev.name)
      .setDescription(formatEventUTC(ev.day, ev.month, ev.hour, ev.minute, ev.year))
      .setValue(ev.id)
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(options);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

/* ======================================================
   HANDLE MANUAL REMINDER BUTTON
====================================================== */
export async function handleManualReminder(interaction: ButtonInteraction) {
  const traceId = createTraceId();

  const guildId = interaction.guildId;
  if (!guildId) {
    logger.emit({
      scope: "events.manualReminder",
      event: "missing_guild",
      traceId,
      level: "error",
    });

    await interaction.reply({
      content: "❌ Cannot load events: no guild.",
      ephemeral: true
    });
    return;
  }

  try {
    const events = await getEvents(guildId);

    // ❗ filtr: usuwamy birthday events
    const upcomingEvents = events.filter(
      e => e.status !== "PAST" && e.eventType !== "birthdays"
    );

    if (!upcomingEvents.length) {
      await interaction.reply({
        content: "No upcoming events available for manual reminder.",
        ephemeral: true
      });
      return;
    }

    const row = createEventSelectMenu(
      upcomingEvents,
      "manual_reminder_select",
      "Select an event to manually send a reminder"
    );

    await interaction.reply({
      content: "Select an event to manually send a reminder:",
      components: [row],
      ephemeral: true
    });

    logger.emit({
      scope: "events.manualReminder",
      event: "open_select",
      traceId,
      context: {
        guildId,
        eventsCount: upcomingEvents.length,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "events.manualReminder",
      event: "load_failed",
      traceId,
      level: "error",
      error: err,
    });

    await interaction.reply({
      content: "❌ Failed to load events.",
      ephemeral: true
    }).catch(() => null);
  }
}

/* ======================================================
   HANDLE MANUAL REMINDER SELECT
====================================================== */
export async function handleManualReminderSelect(interaction: StringSelectMenuInteraction) {
  const traceId = createTraceId();

  const guildId = interaction.guildId;
  const selectedEventId = interaction.values?.[0];

  if (!guildId || !selectedEventId) {
    await interaction.reply({
      content: "No event selected.",
      ephemeral: true
    });
    return;
  }

  try {
    const events = await getEvents(guildId);
    const event = events.find(e => e.id === selectedEventId);

    if (!event) {
      await interaction.reply({
        content: "Event not found.",
        ephemeral: true
      });
      return;
    }

    const config = await getConfig(guildId);
    const channelId = config.notificationChannel;

    if (!channelId) {
      await interaction.reply({
        content: "Notification channel not set.",
        ephemeral: true
      });
      return;
    }

    const rawChannel = interaction.guild?.channels.cache.get(channelId);

    if (!rawChannel || !rawChannel.isTextBased()) {
      await interaction.reply({
        content: "Notification channel invalid.",
        ephemeral: true
      });
      return;
    }

    const channel = rawChannel as TextChannel;

    await sendReminderMessage(channel, event);

    await interaction.update({
      content: `Manual reminder sent for **${event.name}**`,
      components: []
    });

    logger.emit({
      scope: "events.manualReminder",
      event: "reminder_sent",
      traceId,
      context: {
        guildId,
        eventId: selectedEventId,
        channelId,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "events.manualReminder",
      event: "reminder_failed",
      traceId,
      level: "error",
      context: {
        guildId,
        eventId: selectedEventId,
      },
      error: err,
    });

    await interaction.reply({
      content: "❌ Failed to send reminder.",
      ephemeral: true
    }).catch(() => null);
  }
}