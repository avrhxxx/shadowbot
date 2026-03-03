
import { Interaction } from "discord.js";

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
export async function handleEventInteraction(interaction: Interaction) {
  if (
    !interaction.isButton() &&
    !interaction.isModalSubmit() &&
    !interaction.isStringSelectMenu()
  ) return;

  const { customId } = interaction;

  if (!customId.startsWith("event_")) return;

  switch (customId) {
    case "event_create":
      return handleCreate(interaction);

    case "event_list":
      return handleList(interaction);

    case "event_cancel":
      return handleCancel(interaction);

    case "event_manual_reminder":
      return handleManualReminder(interaction);

    case "event_download":
      return handleDownload(interaction);

    case "event_settings":
      return handleSettings(interaction);

    case "event_help":
      return handleHelp(interaction);

    default:
      console.warn(`Nieobsługiwany event customId: ${customId}`);
  }
}