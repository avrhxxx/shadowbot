// src/eventsPanel/eventsHandler.ts
import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CacheType,
} from "discord.js";

import * as EB from "./eventsButtons";
import { parseEventId } from "./eventsButtons/utils";

export const IDS = {
  BUTTONS: {
    CREATE: "event_create",
    LIST: "event_list",
    CANCEL: "event_cancel",
    CANCEL_ABORT: "event_cancel_abort",
    SETTINGS: "event_settings",
    HELP: "event_help",
    MANUAL_REMINDER: "event_manual_reminder",
    SHOW_ALL: "event_show_all",
    SHOW_ALL_LISTS: "show_all_lists",
    DOWNLOAD_ALL: "download_all_events",
    COMPARE_ALL: "compare_all_events",
  },
  SELECTS: {
    MANUAL_REMINDER: "manual_reminder_select",
    SETTINGS_NOTIFICATION: "event_settings_notification",
    SETTINGS_DOWNLOAD: "event_settings_download",
    CANCEL_SELECT: "event_cancel_select",
    COMPARE_SELECT_PREFIX: "compare_select_",
  },
  MODALS: {
    CREATE: "event_create_modal",
    ADD_PREFIX: "event_add_modal_",
    REMOVE_PREFIX: "event_remove_modal_",
    ABSENT_PREFIX: "event_absent_modal_",
  },
};

// ----------------------------
// Stałe button handlers
// ----------------------------
const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  [IDS.BUTTONS.CREATE]: async (i) => await EB.handleCreate(i),
  [IDS.BUTTONS.LIST]: async (i) => await EB.handleList(i),
  [IDS.BUTTONS.CANCEL]: async (i) => await EB.handleCancel(i),
  [IDS.BUTTONS.CANCEL_ABORT]: async (i) => await EB.handleCancelAbort(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => await EB.handleSettings(i),
  [IDS.BUTTONS.HELP]: async (i) => await EB.handleHelp(i),
  [IDS.BUTTONS.MANUAL_REMINDER]: async (i) => await EB.handleManualReminder(i),
  [IDS.BUTTONS.SHOW_ALL]: async (i) => await EB.handleShowAllEvents(i),
  [IDS.BUTTONS.SHOW_ALL_LISTS]: async (i) => await EB.handleShowAllLists(i),
  [IDS.BUTTONS.DOWNLOAD_ALL]: async (i) => await EB.handleDownload(i),
  [IDS.BUTTONS.COMPARE_ALL]: async (i) => await EB.handleCompareAll(i),
};

// ----------------------------
// Stałe select handlers
// ----------------------------
const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction<CacheType>) => Promise<any>> = {
  [IDS.SELECTS.MANUAL_REMINDER]: async (i) => await EB.handleManualReminderSelect(i),
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: async (i) => await EB.handleSettingsSelect(i),
  [IDS.SELECTS.SETTINGS_DOWNLOAD]: async (i) => await EB.handleSettingsSelect(i),
  [IDS.SELECTS.CANCEL_SELECT]: async (i) => await EB.handleCancelSelect(i),
};

// ----------------------------
// Modal submit handler
// ----------------------------
async function handleModal(interaction: ModalSubmitInteraction<CacheType>) {
  const { customId } = interaction;

  if (customId === IDS.MODALS.CREATE)
    await EB.handleCreateSubmit(interaction);
  else if (customId.startsWith(IDS.MODALS.ADD_PREFIX))
    await EB.handleAddParticipantSubmit(interaction, parseEventId(customId));
  else if (customId.startsWith(IDS.MODALS.REMOVE_PREFIX))
    await EB.handleRemoveParticipantSubmit(interaction, parseEventId(customId));
  else if (customId.startsWith(IDS.MODALS.ABSENT_PREFIX))
    await EB.handleAbsentParticipantSubmit(interaction, parseEventId(customId));
}

// ----------------------------
// Główny handler interakcji
// ----------------------------
export async function handleEventInteraction(interaction: Interaction<CacheType>) {
  try {
    if (interaction.isButton()) {
      const id = interaction.customId;

      const handler = BUTTON_HANDLERS[id];
      if (handler) return await handler(interaction);

      // Cancel confirm
      if (id.startsWith("event_cancel_confirm_")) {
        const eventId = id.replace("event_cancel_confirm_", "");
        return await EB.handleCancelConfirm(interaction, eventId);
      }

      // Notify create
      if (id.startsWith("notify_create_yes") || id.startsWith("notify_create_no")) {
        return await EB.handleNotificationResponse(interaction);
      }

      // Next year
      if (id.startsWith("next_year_yes")) return await EB.finalizeNextYearEvent(interaction);
      if (id.startsWith("next_year_no")) return await EB.handleCancelAbort(interaction);

      // Participants
      if (id.startsWith("event_add_"))
        return await EB.handleAddParticipant(interaction, parseEventId(id));

      if (id.startsWith("event_remove_"))
        return await EB.handleRemoveParticipant(interaction, parseEventId(id));

      if (id.startsWith("event_absent_"))
        return await EB.handleAbsentParticipant(interaction, parseEventId(id));

      // Event list
      if (id.startsWith("event_show_list_"))
        return await EB.handleShowList(interaction, parseEventId(id));

      // Download single
      if (id.startsWith("event_download_single_"))
        return await EB.handleDownload(interaction, parseEventId(id));

      // Compare events
      if (id.startsWith("event_compare_"))
        return await EB.handleCompareButton(interaction, parseEventId(id));

      // Compare All Download
      if (id === "compare_all_download")
        return await EB.handleCompareAllDownload(interaction);

      // Clear event
      if (id.startsWith("event_clear_"))
        return await EB.handleClearEventButton(interaction, parseEventId(id));
    }

    // ----------------------------
    // Select menus
    // ----------------------------
    if (interaction.isStringSelectMenu()) {
      const handler = SELECT_HANDLERS[interaction.customId];
      if (handler) return await handler(interaction);

      if (interaction.customId.startsWith(IDS.SELECTS.COMPARE_SELECT_PREFIX))
        return await EB.handleCompareSelect(interaction);
    }

    // ----------------------------
    // Modal submit
    // ----------------------------
    if (interaction.isModalSubmit()) {
      return await handleModal(interaction);
    }
  } catch (error) {
    console.error("Error handling event interaction:", error);
    if (interaction.isRepliable())
      await interaction.reply({
        content: "❌ An error occurred while processing this interaction.",
        ephemeral: true
      });
  }
}