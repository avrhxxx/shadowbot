// src/eventsPanel/eventsButtons/eventsClear.ts
import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { updateEventEmbed } from "./eventsList";

/**
 * Wyświetla modal confirm dla przycisku Clear Event Data
 */
export async function handleClearEventButton(interaction: ButtonInteraction, eventId: string, eventName: string) {
  const modal = new ModalBuilder()
    .setCustomId(`confirm_clear_event_${eventId}`)
    .setTitle("Confirm Clear Event Data");

  const warningInput = new TextInputBuilder()
    .setCustomId("confirm_text")
    .setLabel(`Type CLEAR to delete all data for "${eventName}"`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Type CLEAR to confirm")
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(warningInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

/**
 * Handler dla submit modal confirm
 */
export async function handleClearEventSubmit(interaction: any) {
  const customId = interaction.customId as string;
  if (!customId.startsWith("confirm_clear_event_")) return;

  const eventId = customId.replace("confirm_clear_event_", "");
  const confirmText = interaction.fields.getTextInputValue("confirm_text");

  if (confirmText !== "CLEAR") {
    await interaction.reply({ content: "Clear action canceled. You did not type CLEAR.", ephemeral: true });
    return;
  }

  const guildId = interaction.guildId!;
  let events = await EventStorage.getEvents(guildId);
  const eventIndex = events.findIndex(e => e.id === eventId);

  if (eventIndex === -1) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const eventName = events[eventIndex].name;

  // Usuń event z bazy
  events.splice(eventIndex, 1);
  await EventStorage.saveEvents(guildId, events);

  await interaction.reply({ content: `✅ All data for **${eventName}** has been cleared.`, ephemeral: true });

  // Opcjonalnie: zaktualizuj embed listy jeśli był pokazany
  if (interaction.message) {
    await updateEventEmbed(interaction.message, eventId);
  }
}