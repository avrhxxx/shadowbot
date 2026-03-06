// src/eventsPanel/eventsButtons/eventsClear.ts
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { updateEventEmbed } from "./eventsList";

/* ======================================================
   🔹 STEP 1 – SHOW CONFIRMATION
====================================================== */
export async function handleClearEventButton(
  interaction: ButtonInteraction,
  eventId: string,
  eventName: string
) {
  const embed = new EmbedBuilder()
    .setTitle("⚠️ Confirm Clear Event Data")
    .setDescription(
      `Are you sure you want to **clear all data** for event **${eventName}**?\n\n` +
      `This will permanently delete **all participants, absences, and other event data**. This action **cannot be undone**.`
    )
    .setColor("Red");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_clear_confirm_${eventId}`)
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

/* ======================================================
   🔹 STEP 2 – CONFIRM BUTTON
====================================================== */
export async function handleClearEventConfirm(
  interaction: ButtonInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;
  let events = await EventStorage.getEvents(guildId);

  // Porównanie ID jako string, dla bezpieczeństwa
  const eventIndex = events.findIndex(e => e.id.toString() === eventId.toString());
  if (eventIndex === -1) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const eventName = events[eventIndex].name;

  // Usuń event z bazy
  events.splice(eventIndex, 1);
  await EventStorage.saveEvents(guildId, events);

  const embed = new EmbedBuilder()
    .setTitle("Event Cleared")
    .setDescription(`✅ All data for **${eventName}** has been permanently cleared.`)
    .setColor("Red");

  // Aktualizacja reply
  await interaction.update({ content: "", embeds: [embed], components: [] });

  // Spróbuj zaktualizować embed listy w kanale (jeżeli wiadomość istnieje)
  if (interaction.message) {
    try {
      await updateEventEmbed(interaction.message, eventId);
    } catch (err) {
      console.warn("Could not update event embed after clearing:", err);
    }
  }
}

/* ======================================================
   🔹 STEP 3 – ABORT BUTTON
====================================================== */
export async function handleClearEventAbort(interaction: ButtonInteraction) {
  await interaction.update({
    content: "Clear action aborted.",
    embeds: [],
    components: []
  });
}