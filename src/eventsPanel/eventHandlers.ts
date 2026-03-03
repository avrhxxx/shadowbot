// src/eventsPanel/eventHandlers.ts
import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction
} from "discord.js";

// Importujemy wszystkie handler-y przycisków
import { handleCreate } from "./eventsButtons/eventsCreate";
import { handleList } from "./eventsButtons/eventsList";
import { handleCancel } from "./eventsButtons/eventsCancel";
import { handleManualReminder } from "./eventsButtons/eventsReminder";
import { handleDownload } from "./eventsButtons/eventsDownload";
import { handleSettings } from "./eventsButtons/eventsSettings";
import { handleHelp } from "./eventsButtons/eventsHelp";

/**
 * Główny router Event Panelu
 * Każdy button / modal / select menu event_* trafia tutaj
 */
export async function handleEventInteraction(
  interaction: Interaction
): Promise<void> {
  if (
    !interaction.isButton() &&
    !interaction.isModalSubmit() &&
    !interaction.isStringSelectMenu()
  )
    return;

  const { customId } = interaction;

  if (!customId.startsWith("event_")) return;

  switch (customId) {
    case "event_create":
      if (interaction.isButton()) await handleCreate(interaction);
      break;

    case "event_list":
      if (interaction.isButton()) await handleList(interaction);
      break;

    case "event_cancel":
      if (interaction.isButton()) await handleCancel(interaction);
      break;

    case "event_manual_reminder":
      if (interaction.isButton()) await handleManualReminder(interaction);
      break;

    case "event_download":
      if (interaction.isButton()) await handleDownload(interaction);
      break;

    case "event_settings":
      if (interaction.isButton()) await handleSettings(interaction);
      break;

    case "event_help":
      if (interaction.isButton()) await handleHelp(interaction);
      break;

    // Tutaj w przyszłości możesz obsługiwać select menu / modal submit
    default:
      console.warn(`Nieobsługiwany event customId: ${customId}`);
  }
}