// src/eventsPanel/eventHandlers.ts
import { Interaction } from "discord.js";
import * as EventStorage from "./eventStorage";

// Importy buttonów / modali / selectów
import { handleCreate } from "./eventsButtons/eventsCreate";
import { handleCreateSubmit } from "./eventsButtons/eventsCreateSubmit";
import { handleList, handleShowList } from "./eventsButtons/eventsList";
import {
  handleCancel,
  handleCancelSelect,
  handleCancelConfirm,
  handleCancelAbort
} from "./eventsButtons/eventsCancel";
import { handleManualReminder, handleManualReminderSelect } from "./eventsButtons/eventsReminder";
import { handleDownload } from "./eventsButtons/eventsDownload";
import { handleSettings } from "./eventsButtons/eventsSettings";
import { handleSettingsSelect } from "./eventsButtons/eventsSettingsSelect";
import { handleHelp } from "./eventsButtons/eventsHelp";
import { handleCompare } from "./eventsButtons/eventsCompare"; // 🔥 DODANE

// Uczestnicy
import {
  handleAddParticipant,
  handleRemoveParticipant,
  handleAbsentParticipant,
  handleAddParticipantSubmit,
  handleRemoveParticipantSubmit,
  handleAbsentParticipantSubmit
} from "./eventsButtons/eventsParticipants";

/**
 * Główny router Event Panelu
 */
export async function handleEventInteraction(interaction: Interaction): Promise<void> {

  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const { customId } = interaction;
  if (!customId.startsWith("event_")) return;

  /* =======================================================
     🔥 DYNAMIC – CONFIRM CANCEL
  ======================================================= */
  if (interaction.isButton() && customId.startsWith("event_cancel_confirm_")) {
    const eventId = customId.replace("event_cancel_confirm_", "");
    await handleCancelConfirm(interaction, eventId);
    return;
  }

  /* =======================================================
     🔥 DYNAMIC – BUTTONS
  ======================================================= */
  if (interaction.isButton()) {

    if (customId.startsWith("event_add_")) {
      const eventId = customId.replace("event_add_", "");
      await handleAddParticipant(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_remove_")) {
      const eventId = customId.replace("event_remove_", "");
      await handleRemoveParticipant(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_absent_")) {
      const eventId = customId.replace("event_absent_", "");
      await handleAbsentParticipant(interaction, eventId);
      return;
    }

    // 🔥 NOWE – COMPARE
    if (customId.startsWith("event_compare_")) {
      const eventId = customId.replace("event_compare_", "");
      await handleCompare(interaction, eventId);
      return;
    }

    /* =======================================================
       🔥 LIST BUTTONS
    ======================================================= */

    if (customId.startsWith("event_show_list_")) {
      const eventId = customId.replace("event_show_list_", "");
      await handleShowList(interaction, eventId); // 🔹 Poprawnie wywołujemy handler z eventsList.ts
      return;
    }

    if (customId.startsWith("event_download_single_")) {
      const eventId = customId.replace("event_download_single_", "");
      await handleDownload(interaction, eventId);
      return;
    }
  }

  /* =======================================================
     🔥 DYNAMIC – MODALS
  ======================================================= */
  if (interaction.isModalSubmit()) {

    if (customId.startsWith("event_add_modal_")) {
      const eventId = customId.replace("event_add_modal_", "");
      await handleAddParticipantSubmit(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_remove_modal_")) {
      const eventId = customId.replace("event_remove_modal_", "");
      await handleRemoveParticipantSubmit(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_absent_modal_")) {
      const eventId = customId.replace("event_absent_modal_", "");
      await handleAbsentParticipantSubmit(interaction, eventId);
      return;
    }
  }

  /* =======================================================
     🔥 STANDARDOWE CUSTOM ID
  ======================================================= */
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

    case "event_cancel_abort":
      if (interaction.isButton()) await handleCancelAbort(interaction);
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

    // MODAL
    case "event_create_modal":
      if (interaction.isModalSubmit()) await handleCreateSubmit(interaction);
      break;

    // SELECT MENU
    case "event_settings_notification":
    case "event_settings_download":
      if (interaction.isStringSelectMenu()) {
        await handleSettingsSelect(interaction);
      }
      break;

    case "event_cancel_select":
      if (interaction.isStringSelectMenu()) await handleCancelSelect(interaction);
      break;

    case "event_manual_reminder_select":
      if (interaction.isStringSelectMenu()) await handleManualReminderSelect(interaction);
      break;

    default:
      console.warn(`Nieobsługiwany event customId: ${customId}`);
  }
}