// =====================================
// 📁 src/system/events/eventsButtons/eventsManualReminder.ts
// =====================================

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
import { log } from "../../../core/logger/log";
import type { TraceContext } from "../../../core/trace/TraceContext";

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
export async function handleManualReminder(
  interaction: ButtonInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;

  if (!guildId) {
    l.error("missing_guild");

    await interaction.reply({
      content: "❌ Cannot load events: no guild.",
      ephemeral: true
    });
    return;
  }

  try {
    const events = await getEvents(guildId);

    const upcomingEvents = events.filter(
      e => e.status !== "PAST" && e.eventType !== "birthdays"
    );

    if (!upcomingEvents.length) {
      l.warn("no_upcoming_events", { guildId });

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

    l.event("open_select", {
      guildId,
      eventsCount: upcomingEvents.length,
    });

  } catch (err) {
    l.error("load_failed", err);

    await interaction.reply({
      content: "❌ Failed to load events.",
      ephemeral: true
    }).catch(() => null);
  }
}

/* ======================================================
   HANDLE MANUAL REMINDER SELECT
====================================================== */
export async function handleManualReminderSelect(
  interaction: StringSelectMenuInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const selectedEventId = interaction.values?.[0];

  if (!guildId || !selectedEventId) {
    l.warn("missing_selection", { guildId });

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
      l.warn("event_not_found", { guildId, eventId: selectedEventId });

      await interaction.reply({
        content: "Event not found.",
        ephemeral: true
      });
      return;
    }

    const config = await getConfig(guildId);
    const channelId = config.notificationChannel;

    if (!channelId) {
      l.warn("missing_notification_channel", { guildId });

      await interaction.reply({
        content: "Notification channel not set.",
        ephemeral: true
      });
      return;
    }

    const rawChannel = interaction.guild?.channels.cache.get(channelId);

    if (!rawChannel || !rawChannel.isTextBased()) {
      l.warn("invalid_notification_channel", { channelId });

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

    l.event("reminder_sent", {
      guildId,
      eventId: selectedEventId,
      channelId,
    });

  } catch (err) {
    l.error("reminder_failed", err);

    await interaction.reply({
      content: "❌ Failed to send reminder.",
      ephemeral: true
    }).catch(() => null);
  }
}