// src/eventsPanel/eventsButtons/eventsClear.ts
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  Message
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { updateEventEmbed } from "./eventsList";

/* ======================================================
   🔹 STEP 1 – BUTTON → CONFIRMATION
====================================================== */
export async function handleClearEventButton(interaction: ButtonInteraction, eventId: string, eventName: string) {
  const embed = new EmbedBuilder()
    .setTitle("⚠️ Confirm Clear Event Data")
    .setDescription(
      `Are you sure you want to **clear all data** for event **${eventName}**?\n\n` +
      `This will permanently delete **all participants, absences, and other event data**. This action **cannot be undone**.`
    )
    .setColor("Red");

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`event_clear_confirm_${eventId}`)
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Danger);

  const abortBtn = new ButtonBuilder()
    .setCustomId(`event_clear_abort`)
    .setLabel("Abort")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, abortBtn);

  await interaction.update({
    content: "",
    embeds: [embed],
    components: [row]
  });
};

/* ======================================================
   🔹 STEP 2 – CONFIRM BUTTON
====================================================== */
export async function handleClearEventConfirm(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);
  const eventIndex = events.findIndex(e => e.id === eventId);

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

  await interaction.update({ content: "", embeds: [embed], components: [] });

  // Aktualizacja embed listy w kanale, jeśli istnieje
  try {
    if (interaction.message) {
      await updateEventEmbed(interaction.message as Message, eventId);
    }
  } catch (err) {
    console.warn("Could not update event embed after clearing:", err);
  }
};

/* ======================================================
   🔹 STEP 3 – ABORT BUTTON
====================================================== */
export async function handleClearEventAbort(interaction: ButtonInteraction) {
  await interaction.update({
    content: "Clear action aborted.",
    embeds: [],
    components: []
  });
};