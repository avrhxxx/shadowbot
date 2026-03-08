// src/eventsPanel/eventsButtons/eventsClear.ts
import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from "discord.js";
import { getEvents, deleteEvent as serviceDeleteEvent, EventObject } from "../eventService";
import { parseEventId } from "../buttonIds"; // funkcja do wyciągania ID eventu z customId
import { makeClearEventId } from "../buttonIds"; // maker do tworzenia dynamicznych customId

// ======================================================
// HELPERS
// ======================================================
async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  const event = events.find(e => e.id.toString().trim() === eventId.toString().trim());
  return event || null;
}

// ======================================================
// HANDLE CLEAR BUTTON
// ======================================================
export async function handleClearEventButton(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const event = await getEventById(guildId, eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const eventName = event.name;

  // Tworzymy dynamiczne customId dla przycisków Confirm i Abort
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
      `Are you sure you want to **clear all data** for event **${eventName}**?\n\n` +
      `This will permanently delete **all participants, absences, and other event data**.\nThis action **cannot be undone**.`
    )
    .setColor("Red");

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// ======================================================
// HANDLE CONFIRM CLEAR
// ======================================================
export async function handleClearEventConfirm(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const eventId = parseEventId(interaction.customId); // wyciągamy eventId z customId
  const event = await getEventById(guildId, eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const eventName = event.name;

  // Usuwamy event z serwisu
  await serviceDeleteEvent(eventId);

  const embed = new EmbedBuilder()
    .setTitle("Event Cleared")
    .setDescription(`✅ All data for **${eventName}** has been permanently cleared.`)
    .setColor("Red");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ======================================================
// HANDLE ABORT CLEAR
// ======================================================
export async function handleClearEventAbort(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const eventId = parseEventId(interaction.customId); // wyciągamy eventId z customId
  const event = await getEventById(guildId, eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: "Clear action aborted.", ephemeral: true });
}