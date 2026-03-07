import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from "discord.js";
import { getEvents } from "../eventService";
import { deleteEvent } from "../googleSheetsStorage";

const clearEventStore = new Map<string, string>();

export async function handleClearEventButton(
  interaction: ButtonInteraction,
  eventId: string,
  eventName: string
) {
  clearEventStore.set(interaction.user.id, eventId);

  const embed = new EmbedBuilder()
    .setTitle("⚠️ Confirm Clear Event Data")
    .setDescription(
      `Are you sure you want to **clear all data** for event **${eventName}**?\n\n` +
      `This will permanently delete **all participants, absences, and other event data**.\nThis action **cannot be undone**.`
    )
    .setColor("Red");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("event_clear_confirm")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("event_clear_abort")
      .setLabel("Abort")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

export async function handleClearEventConfirm(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const eventId = clearEventStore.get(interaction.user.id);

  if (!eventId) {
    await interaction.reply({ content: "Temporary event info not found. Please try again.", ephemeral: true });
    return;
  }

  const events = await getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    clearEventStore.delete(interaction.user.id);
    return;
  }

  const eventName = event.name;

  // Usuń event permanentnie z arkusza
  await deleteEvent(guildId, eventId);

  clearEventStore.delete(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle("Event Cleared")
    .setDescription(`✅ All data for **${eventName}** has been permanently cleared.`)
    .setColor("Red");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleClearEventAbort(interaction: ButtonInteraction) {
  clearEventStore.delete(interaction.user.id);
  await interaction.reply({ content: "Clear action aborted.", ephemeral: true });
}