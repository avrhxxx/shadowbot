// =====================================
// 📁 src/system/events/eventsButtons/eventsClear.ts
// =====================================

import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder
} from "discord.js";

import {
  getEvents,
  deleteEvent as serviceDeleteEvent,
  EventObject
} from "../eventService";

import { parseEventId } from "./utils";
import { log } from "../../../core/logger/log";
import type { TraceContext } from "../../../core/trace/TraceContext";

// ======================================================
// HELPERS
// ======================================================
async function getEventById(
  guildId: string,
  eventId: string
): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find(e => e.id.toString() === eventId.toString()) || null;
}

// ======================================================
// HANDLE CLEAR BUTTON
// ======================================================
export async function handleClearEventButton(
  interaction: ButtonInteraction,
  eventId: string,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId;

  if (!guildId) {
    l.error("missing_guild", null);
    return;
  }

  try {
    const event = await getEventById(guildId, eventId);

    if (!event) {
      await interaction.reply({
        content: "Event not found.",
        ephemeral: true
      });

      l.warn("event_not_found", {
        context: { guildId, eventId },
      });

      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`event_clear_confirm_${eventId}`)
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`event_clear_abort_${eventId}`)
        .setLabel("Abort")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Confirm Clear Event Data")
      .setDescription(
        `Are you sure you want to **clear all data** for event **${event.name}**?\n\n` +
        `This will permanently delete **all participants, absences, and other event data**.\n` +
        `This action **cannot be undone**.`
      )
      .setColor("Red");

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    l.event("confirm_ui_shown", {
      context: { guildId, eventId },
    });

  } catch (error) {
    l.error("button_failed", error, {
      context: { guildId, eventId },
    });
  }
}

// ======================================================
// HANDLE CONFIRM CLEAR
// ======================================================
export async function handleClearEventConfirm(
  interaction: ButtonInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId;

  if (!guildId) {
    l.error("missing_guild", null);
    return;
  }

  const eventId = parseEventId(interaction.customId);

  try {
    await interaction.deferReply({ ephemeral: true });

    const event = await getEventById(guildId, eventId);

    if (!event) {
      await interaction.editReply({
        content: "Event not found."
      });

      l.warn("confirm_event_not_found", {
        context: { guildId, eventId },
      });

      return;
    }

    await serviceDeleteEvent(eventId);

    const embed = new EmbedBuilder()
      .setTitle("Event Cleared")
      .setDescription(
        `✅ All data for **${event.name}** has been permanently cleared.`
      )
      .setColor("Red");

    await interaction.editReply({
      embeds: [embed]
    });

    l.event("confirmed", {
      context: { guildId, eventId },
    });

  } catch (error) {
    l.error("confirm_failed", error, {
      context: { guildId, eventId },
    });
  }
}

// ======================================================
// HANDLE ABORT CLEAR
// ======================================================
export async function handleClearEventAbort(
  interaction: ButtonInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  await interaction.reply({
    content: "Clear action aborted.",
    ephemeral: true
  });

  l.event("aborted", {
    context: {
      guildId: interaction.guildId,
      userId: interaction.user?.id,
    },
  });
}