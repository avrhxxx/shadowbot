// =====================================
// 📁 src/system/events/eventsButtons/eventsCancel.ts
// =====================================

import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { cancelEvent, getEvents } from "../eventService";
import { formatEventUTC } from "../../../shared/utils/timeUtils";
import { logger } from "../../../core/logger/log";

/* ======================================================
   🔹 STEP 1 – BUTTON → SELECT
====================================================== */
export async function handleCancel(
  interaction: ButtonInteraction,
  traceId: string
) {
  const guildId = interaction.guildId;

  logger.emit({
    scope: "events.cancel",
    event: "open",
    traceId,
    context: {
      guildId,
      userId: interaction.user?.id,
    },
  });

  if (!guildId) {
    logger.emit({
      scope: "events.cancel",
      event: "missing_guild",
      traceId,
      level: "error",
    });
    return;
  }

  const events = await getEvents(guildId);

  const activeEvents = events.filter(
    e => e.status === "ACTIVE" && e.eventType !== "birthdays"
  );

  if (!activeEvents.length) {
    logger.emit({
      scope: "events.cancel",
      event: "no_active_events",
      traceId,
      level: "warn",
      context: { guildId },
    });

    await interaction.reply({
      content: "No active events to cancel.",
      ephemeral: true
    });
    return;
  }

  const uniqueActiveEvents = Array.from(
    new Map(activeEvents.map(e => [e.id, e])).values()
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("event_cancel_select")
    .setPlaceholder("Select an event to cancel")
    .addOptions(
      uniqueActiveEvents.map(e => ({
        label: e.name,
        description: formatEventUTC(
          e.day,
          e.month,
          e.hour,
          e.minute,
          e.year
        ),
        value: e.id
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({
    content: "Select event to cancel:",
    components: [row],
    ephemeral: true
  });

  logger.emit({
    scope: "events.cancel",
    event: "select_rendered",
    traceId,
    context: {
      guildId,
      eventsCount: uniqueActiveEvents.length,
    },
  });
}

/* ======================================================
   🔹 STEP 2 – SELECT → CONFIRMATION
====================================================== */
export async function handleCancelSelect(
  interaction: StringSelectMenuInteraction,
  traceId: string
) {
  const guildId = interaction.guildId!;
  const eventId = interaction.values[0];

  logger.emit({
    scope: "events.cancel",
    event: "select",
    traceId,
    input: {
      guildId,
      eventId,
    },
  });

  await interaction.deferUpdate();

  const events = await getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    logger.emit({
      scope: "events.cancel",
      event: "event_not_found",
      traceId,
      level: "warn",
      context: { guildId, eventId },
    });

    await interaction.followUp({
      content: "Event not found.",
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Confirm Cancellation")
    .setDescription(
      `Are you sure you want to cancel **${event.name}**?\n\n` +
      `📅 ${formatEventUTC(
        event.day,
        event.month,
        event.hour,
        event.minute,
        event.year
      )}`
    )
    .setColor("Orange");

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`event_cancel_confirm_${eventId}`)
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Danger);

  const abortBtn = new ButtonBuilder()
    .setCustomId("event_cancel_abort")
    .setLabel("Abort")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, abortBtn);

  await interaction.editReply({
    content: "",
    embeds: [embed],
    components: [row]
  });

  logger.emit({
    scope: "events.cancel",
    event: "confirm_rendered",
    traceId,
    context: {
      guildId,
      eventId,
    },
  });
}

/* ======================================================
   🔹 STEP 3 – CONFIRM BUTTON
====================================================== */
export async function handleCancelConfirm(
  interaction: ButtonInteraction,
  eventId: string,
  traceId: string
) {
  const guildId = interaction.guildId!;

  logger.emit({
    scope: "events.cancel",
    event: "confirm_click",
    traceId,
    input: {
      guildId,
      eventId,
    },
  });

  await interaction.deferUpdate();

  try {
    const event = await cancelEvent(guildId, eventId);

    if (!event) {
      logger.emit({
        scope: "events.cancel",
        event: "event_not_found",
        traceId,
        level: "warn",
      });

      await interaction.followUp({
        content: "Event not found.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Event Canceled")
      .setDescription(`**${event.name}** has been canceled.`)
      .setColor("Red");

    await interaction.editReply({
      embeds: [embed],
      components: []
    });

    logger.emit({
      scope: "events.cancel",
      event: "success",
      traceId,
    });

  } catch (err) {
    logger.emit({
      scope: "events.cancel",
      event: "cancel_failed",
      traceId,
      level: "error",
      error: err,
    });

    await interaction.followUp({
      content: "❌ Failed to cancel event.",
      ephemeral: true
    });
  }
}

/* ======================================================
   🔹 STEP 4 – ABORT BUTTON
====================================================== */
export async function handleCancelAbort(
  interaction: ButtonInteraction,
  traceId: string
) {
  logger.emit({
    scope: "events.cancel",
    event: "abort_click",
    traceId,
    context: {
      guildId: interaction.guildId,
      userId: interaction.user?.id,
    },
  });

  await interaction.update({
    content: "Cancellation aborted.",
    embeds: [],
    components: []
  });

  logger.emit({
    scope: "events.cancel",
    event: "aborted",
    traceId,
  });
}