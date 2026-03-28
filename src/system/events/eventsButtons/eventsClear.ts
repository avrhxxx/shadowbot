// src/eventsPanel/eventsButtons/eventsClear.ts
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder
} from "discord.js";

import { getEvents, deleteEvent as serviceDeleteEvent, EventObject } from "../eventService";
import { parseEventId } from "./utils";

// ======================================================
// HELPERS
// ======================================================
async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  const event = events.find(e => e.id.toString() === eventId.toString());
  return event || null;
}

// ======================================================
// HANDLE CLEAR BUTTON
// ======================================================
export async function handleClearEventButton(
  interaction: ButtonInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;

  const event = await getEventById(guildId, eventId);

  if (!event) {
    await interaction.reply({
      content: "Event not found.",
      ephemeral: true
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
}

// ======================================================
// HANDLE CONFIRM CLEAR
// ======================================================
export async function handleClearEventConfirm(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const eventId = parseEventId(interaction.customId);

  const event = await getEventById(guildId, eventId);

  if (!event) {
    await interaction.editReply({
      content: "Event not found."
    });
    return;
  }

  await serviceDeleteEvent(eventId);

  const embed = new EmbedBuilder()
    .setTitle("Event Cleared")
    .setDescription(`✅ All data for **${event.name}** has been permanently cleared.`)
    .setColor("Red");

  await interaction.editReply({
    embeds: [embed]
  });
}

// ======================================================
// HANDLE ABORT CLEAR
// ======================================================
export async function handleClearEventAbort(interaction: ButtonInteraction) {
  await interaction.reply({
    content: "Clear action aborted.",
    ephemeral: true
  });
}