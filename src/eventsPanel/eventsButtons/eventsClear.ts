import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { updateEventEmbed } from "./eventsList";
import { tempEventStore } from "./eventsCreateSubmit";

export async function handleClearEventButton(interaction: ButtonInteraction, eventId: string, eventName: string) {

  // zapis do temporary storage
  tempEventStore.set(interaction.user.id, eventId);

  const embed = new EmbedBuilder()
    .setTitle("⚠️ Confirm Clear Event Data")
    .setDescription(
      `Are you sure you want to **clear all data** for event **${eventName}**?\n\n` +
      `This will permanently delete **all participants, absences, and other event data**. This action **cannot be undone**.`
    )
    .setColor("Red");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_clear_confirm`)
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`event_clear_abort`)
      .setLabel("Abort")
      .setStyle(ButtonStyle.Secondary)
  );

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: "", embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ content: "", embeds: [embed], components: [row], ephemeral: true });
  }
}

export async function handleClearEventConfirm(interaction: ButtonInteraction) {

  const guildId = interaction.guildId!;
  const eventId = tempEventStore.get(interaction.user.id);

  if (!eventId) {
    await interaction.reply({ content: "Temporary event info not found. Please try again.", ephemeral: true });
    return;
  }

  let events = await EventStorage.getEvents(guildId);

  const eventIndex = events.findIndex(e => e.id.toString() === eventId.toString());

  if (eventIndex === -1) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    tempEventStore.delete(interaction.user.id);
    return;
  }

  const eventName = events[eventIndex].name;

  events.splice(eventIndex, 1);

  await EventStorage.saveEvents(guildId, events);

  tempEventStore.delete(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle("Event Cleared")
    .setDescription(`✅ All data for **${eventName}** has been permanently cleared.`)
    .setColor("Red");

  await interaction.update({
    content: "",
    embeds: [embed],
    components: []
  });

  if (interaction.message) {
    try {
      await updateEventEmbed(interaction.message, eventId);
    } catch (err) {
      console.warn("Could not update event embed after clearing:", err);
    }
  }
}

export async function handleClearEventAbort(interaction: ButtonInteraction) {

  tempEventStore.delete(interaction.user.id);

  await interaction.update({
    content: "Clear action aborted.",
    embeds: [],
    components: []
  });
}