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
import { log } from "../../../core/logger/log";
import type { TraceContext } from "../../../core/trace/TraceContext";

/* ======================================================
   🔹 STEP 1 – BUTTON → SELECT
====================================================== */
export async function handleCancel(
  interaction: ButtonInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId;

  l.event("open", {
    guildId,
    userId: interaction.user?.id,
  });

  if (!guildId) {
    l.error("missing_guild", null);
    return;
  }

  const events = await getEvents(guildId);

  const activeEvents = events.filter(
    e => e.status === "ACTIVE" && e.eventType !== "birthdays"
  );

  if (!activeEvents.length) {
    l.warn("no_active_events", { guildId });

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

  l.event("select_rendered", {
    guildId,
    eventsCount: uniqueActiveEvents.length,
  });
}

/* ======================================================
   🔹 STEP 2 – SELECT → CONFIRMATION
====================================================== */
export async function handleCancelSelect(
  interaction: StringSelectMenuInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  const guildId = interaction.guildId!;
  const eventId = interaction.values[0];

  l.event("select", {
    guildId,
    eventId,
  });

  await interaction.deferUpdate();

  const events = await getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    l.warn("event_not_found", { guildId, eventId });

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

  l.event("confirm_rendered", {
    guildId,
    eventId,
  });
}

/* ======================================================
   🔹 STEP 3 – CONFIRM BUTTON
====================================================== */
export async function handleCancelConfirm(
  interaction: ButtonInteraction,
  eventId: string,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId!;

  l.event("confirm_click", {
    guildId,
    eventId,
  });

  await interaction.deferUpdate();

  try {
    const event = await cancelEvent(guildId, eventId);

    if (!event) {
      l.warn("event_not_found");

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

    l.event("success");

  } catch (err) {
    l.error("cancel_failed", err);

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
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  l.event("abort_click", {
    guildId: interaction.guildId,
    userId: interaction.user?.id,
  });

  await interaction.update({
    content: "Cancellation aborted.",
    embeds: [],
    components: []
  });

  l.event("aborted");
}