import { Interaction } from "discord.js";
import * as EventStorage from "./eventStorage";

// Buttons / modals / selects
import { handleCreate } from "./eventsButtons/eventsCreate";
import { handleCreateSubmit } from "./eventsButtons/eventsCreateSubmit";
import { handleList, handleShowList } from "./eventsButtons/eventsList";
import {
  handleCancel,
  handleCancelSelect,
  handleCancelConfirm,
  handleCancelAbort
} from "./eventsButtons/eventsCancel";
import { handleDownload } from "./eventsButtons/eventsDownload";
import { handleSettings, handleSettingsSelect } from "./eventsButtons/eventsSettings";
import { handleHelp } from "./eventsButtons/eventsHelp";

// ✅ NOWE COMPARE IMPORTY
import {
  handleCompareButton,
  handleCompareSelect,
  handleCompareDownload
} from "./eventsButtons/eventsCompare";

// Participants
import {
  handleAddParticipant,
  handleRemoveParticipant,
  handleAbsentParticipant,
  handleAddParticipantSubmit,
  handleRemoveParticipantSubmit,
  handleAbsentParticipantSubmit
} from "./eventsButtons/eventsParticipants";

export async function handleEventInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

  const { customId } = interaction;

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

    // Participants
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

    // ✅ COMPARE BUTTON
    if (customId.startsWith("event_compare_")) {
      const eventId = customId.replace("event_compare_", "");
      await handleCompareButton(interaction, eventId);
      return;
    }

    // ✅ COMPARE DOWNLOAD
    if (customId.startsWith("compare_download_")) {
      await handleCompareDownload(interaction);
      return;
    }

    if (customId.startsWith("event_show_list_")) {
      const eventId = customId.replace("event_show_list_", "");
      await handleShowList(interaction, eventId);
      return;
    }

    if (customId.startsWith("event_download_single_")) {
      const eventId = customId.replace("event_download_single_", "");
      await handleDownload(interaction, eventId);
      return;
    }
  }

  /* =======================================================
     🔥 SELECT MENUS
  ======================================================= */
  if (interaction.isStringSelectMenu()) {

    // ✅ COMPARE SELECT
    if (customId.startsWith("compare_select_")) {
      await handleCompareSelect(interaction);
      return;
    }

    if (customId === "event_settings_notification" ||
        customId === "event_settings_download") {
      await handleSettingsSelect(interaction);
      return;
    }

    if (customId === "event_cancel_select") {
      await handleCancelSelect(interaction);
      return;
    }
  }

  /* =======================================================
     🔥 MODALS
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

    if (customId === "event_create_modal") {
      await handleCreateSubmit(interaction);
      return;
    }
  }

  /* =======================================================
     🔥 STANDARD BUTTONS
  ======================================================= */
  if (interaction.isButton()) {
    switch (customId) {
      case "event_create":
        await handleCreate(interaction);
        break;
      case "event_list":
        await handleList(interaction);
        break;
      case "event_cancel":
        await handleCancel(interaction);
        break;
      case "event_cancel_abort":
        await handleCancelAbort(interaction);
        break;
      case "event_download":
        await handleDownload(interaction);
        break;
      case "event_settings":
        await handleSettings(interaction);
        break;
      case "event_help":
        await handleHelp(interaction);
        break;
      default:
        console.warn(`Nieobsługiwany event customId: ${customId}`);
    }
  }
}