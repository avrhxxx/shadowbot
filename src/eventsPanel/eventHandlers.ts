// src/eventsPanel/eventsHandler.ts
import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
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
    SHOW_ALL: "show_all_events",       // ✅ dodany
    SHOW_ALL_LISTS: "show_all_lists",  // ✅ dodany
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
const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction) => Promise<void>> = {
  [IDS.BUTTONS.CREATE]: EB.handleCreate,
  [IDS.BUTTONS.LIST]: EB.handleList,
  [IDS.BUTTONS.CANCEL]: EB.handleCancel,
  [IDS.BUTTONS.CANCEL_ABORT]: EB.handleCancelAbort,
  [IDS.BUTTONS.SETTINGS]: EB.handleSettings,
  [IDS.BUTTONS.HELP]: EB.handleHelp,
  [IDS.BUTTONS.MANUAL_REMINDER]: EB.handleManualReminder,
  [IDS.BUTTONS.SHOW_ALL]: EB.handleShowAllEvents,      // ✅ powiązany handler
  [IDS.BUTTONS.SHOW_ALL_LISTS]: EB.handleShowAllLists, // ✅ powiązany handler
};

// ----------------------------
// Stałe select handlers
// ----------------------------
const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction) => Promise<void>> = {
  [IDS.SELECTS.MANUAL_REMINDER]: EB.handleManualReminderSelect,
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: EB.handleSettingsSelect,
  [IDS.SELECTS.SETTINGS_DOWNLOAD]: EB.handleSettingsSelect,
  [IDS.SELECTS.CANCEL_SELECT]: EB.handleCancelSelect,
};

// ----------------------------
// Modal submit handler
// ----------------------------
function handleModal(interaction: ModalSubmitInteraction) {
  const { customId } = interaction;

  if (customId === IDS.MODALS.CREATE)
    return EB.handleCreateSubmit(interaction);

  if (customId.startsWith(IDS.MODALS.ADD_PREFIX))
    return EB.handleAddParticipantSubmit(interaction, parseEventId(customId));

  if (customId.startsWith(IDS.MODALS.REMOVE_PREFIX))
    return EB.handleRemoveParticipantSubmit(interaction, parseEventId(customId));

  if (customId.startsWith(IDS.MODALS.ABSENT_PREFIX))
    return EB.handleAbsentParticipantSubmit(interaction, parseEventId(customId));
}

// ----------------------------
// Główny handler interakcji
// ----------------------------
export async function handleEventInteraction(interaction: Interaction) {
  try {
    if (interaction.isButton()) {
      const id = interaction.customId;

      // ----------------------------
      // Stałe przyciski
      // ----------------------------
      const handler = BUTTON_HANDLERS[id];
      if (handler) return handler(interaction);

      // ----------------------------
      // Dynamiczne confirm dla cancel
      // ----------------------------
      if (id.startsWith("event_cancel_confirm_")) {
        const eventId = id.replace("event_cancel_confirm_", "");
        return EB.handleCancelConfirm(interaction, eventId);
      }

      // ----------------------------
      // Przycisk notify_create (Yes / No)
      // ----------------------------
      if (id.startsWith("notify_create_yes") || id.startsWith("notify_create_no")) {
        return EB.handleNotificationResponse(interaction);
      }

      // ----------------------------
      // Przycisk next_year (Yes / No)
      // ----------------------------
      if (id.startsWith("next_year_yes")) return EB.finalizeNextYearEvent(interaction);
      if (id.startsWith("next_year_no")) return EB.handleCancelAbort(interaction);

      // ----------------------------
      // dynamiczne przyciski uczestników
      // ----------------------------
      if (id.startsWith("event_add_"))
        return EB.handleAddParticipant(interaction, parseEventId(id));

      if (id.startsWith("event_remove_"))
        return EB.handleRemoveParticipant(interaction, parseEventId(id));

      if (id.startsWith("event_absent_"))
        return EB.handleAbsentParticipant(interaction, parseEventId(id));

      if (id.startsWith("event_show_list_"))
        return EB.handleShowList(interaction, parseEventId(id));

      if (id.startsWith("event_download_single_"))
        return EB.handleDownload(interaction, parseEventId(id));

      if (id.startsWith("event_compare_"))
        return EB.handleCompareButton(interaction, parseEventId(id));

      if (id.startsWith("event_clear_"))
        return EB.handleClearEventButton(interaction, parseEventId(id));
    }

    // ----------------------------
    // Select menu
    // ----------------------------
    if (interaction.isStringSelectMenu()) {
      const handler = SELECT_HANDLERS[interaction.customId];
      if (handler) return handler(interaction);

      if (interaction.customId.startsWith(IDS.SELECTS.COMPARE_SELECT_PREFIX))
        return EB.handleCompareSelect(interaction);
    }

    // ----------------------------
    // Modal submit
    // ----------------------------
    if (interaction.isModalSubmit()) {
      return handleModal(interaction);
    }
  } catch (error) {
    console.error("Error handling event interaction:", error);
    if (interaction.isRepliable())
      await interaction.reply({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
  }
}