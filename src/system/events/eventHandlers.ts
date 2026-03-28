// =====================================
// 📁 src/system/events/eventsHandlers.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CacheType,
} from "discord.js";

import * as EB from "./eventsButtons";
import { parseEventId } from "./eventsButtons/utils";
import { logger } from "../../core/logger/log";

// =====================================
// 🔹 IDS (CENTRALIZED)
// =====================================

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

    CANCEL_CONFIRM_PREFIX: "event_cancel_confirm_",
    ADD_PREFIX: "event_add_",
    REMOVE_PREFIX: "event_remove_",
    ABSENT_PREFIX: "event_absent_",
    SHOW_LIST_PREFIX: "event_show_list_",
    CATEGORY_PREFIX: "event_category_",
    DOWNLOAD_SINGLE_PREFIX: "event_download_single_",
    COMPARE_PREFIX: "event_compare_",
    CLEAR_CONFIRM_PREFIX: "event_clear_confirm_",
    CLEAR_ABORT_PREFIX: "event_clear_abort_",
    CLEAR_PREFIX: "event_clear_",
  },

  SELECTS: {
    MANUAL_REMINDER: "manual_reminder_select",
    SETTINGS_NOTIFICATION: "event_settings_notification",
    SETTINGS_DOWNLOAD: "event_settings_download",
    CANCEL_SELECT: "event_cancel_select",
    COMPARE_SELECT_PREFIX: "compare_select_",
    CREATE_TYPE_SELECT: "event_type_select",
  },

  MODALS: {
    CREATE: "event_create_modal",
    ADD_PREFIX: "event_add_modal_",
    REMOVE_PREFIX: "event_remove_modal_",
    ABSENT_PREFIX: "event_absent_modal_",
  },
};

// =====================================
// HANDLERS
// =====================================

const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  [IDS.BUTTONS.CREATE]: EB.handleCreate,
  [IDS.BUTTONS.LIST]: EB.handleCategoryClick,
  [IDS.BUTTONS.CANCEL]: EB.handleCancel,
  [IDS.BUTTONS.CANCEL_ABORT]: EB.handleCancelAbort,
  [IDS.BUTTONS.SETTINGS]: EB.handleSettings,
  [IDS.BUTTONS.HELP]: EB.handleHelp,
  [IDS.BUTTONS.MANUAL_REMINDER]: EB.handleManualReminder,
  [IDS.BUTTONS.SHOW_ALL]: EB.handleShowAllEvents,
  [IDS.BUTTONS.SHOW_ALL_LISTS]: EB.handleShowAllLists,
  [IDS.BUTTONS.DOWNLOAD_ALL]: EB.handleDownload,
  [IDS.BUTTONS.COMPARE_ALL]: EB.handleCompareAll,
};

const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction<CacheType>) => Promise<any>> = {
  [IDS.SELECTS.MANUAL_REMINDER]: EB.handleManualReminderSelect,
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: EB.handleSettingsSelect,
  [IDS.SELECTS.SETTINGS_DOWNLOAD]: EB.handleSettingsSelect,
  [IDS.SELECTS.CANCEL_SELECT]: EB.handleCancelSelect,
  [IDS.SELECTS.CREATE_TYPE_SELECT]: EB.handleTypeSelect,
};

// =====================================
// MODALS
// =====================================

async function handleModal(
  interaction: ModalSubmitInteraction<CacheType>
): Promise<boolean> {
  const { customId } = interaction;

  if (customId === IDS.MODALS.CREATE || customId.startsWith(`${IDS.MODALS.CREATE}_`)) {
    await EB.handleCreateSubmit(interaction);
    return true;
  }

  if (customId.startsWith(IDS.MODALS.ADD_PREFIX)) {
    await EB.handleAddParticipantSubmit(interaction, parseEventId(customId));
    return true;
  }

  if (customId.startsWith(IDS.MODALS.REMOVE_PREFIX)) {
    await EB.handleRemoveParticipantSubmit(interaction, parseEventId(customId));
    return true;
  }

  if (customId.startsWith(IDS.MODALS.ABSENT_PREFIX)) {
    await EB.handleAbsentParticipantSubmit(interaction, parseEventId(customId));
    return true;
  }

  return false;
}

// =====================================
// MAIN HANDLER
// =====================================

export async function handleEventInteraction(
  interaction: Interaction<CacheType>
): Promise<boolean> {
  try {
    if (interaction.isButton()) {
      const id = interaction.customId;

      const handler = BUTTON_HANDLERS[id];
      if (handler) {
        logger.emit({
          event: "event_button",
          data: { id },
        });

        await handler(interaction);
        return true;
      }

      if (id.startsWith(IDS.BUTTONS.CANCEL_CONFIRM_PREFIX)) {
        return await EB.handleCancelConfirm(
          interaction,
          id.replace(IDS.BUTTONS.CANCEL_CONFIRM_PREFIX, "")
        );
      }

      if (id.startsWith(IDS.BUTTONS.ADD_PREFIX)) {
        return await EB.handleAddParticipant(interaction, parseEventId(id));
      }

      if (id.startsWith(IDS.BUTTONS.REMOVE_PREFIX)) {
        return await EB.handleRemoveParticipant(interaction, parseEventId(id));
      }

      if (id.startsWith(IDS.BUTTONS.ABSENT_PREFIX)) {
        return await EB.handleAbsentParticipant(interaction, parseEventId(id));
      }

      if (id.startsWith(IDS.BUTTONS.SHOW_LIST_PREFIX)) {
        return await EB.handleShowList(interaction, parseEventId(id));
      }

      if (id.startsWith(IDS.BUTTONS.CATEGORY_PREFIX)) {
        return await EB.handleCategoryClick(
          interaction,
          id.replace(IDS.BUTTONS.CATEGORY_PREFIX, "")
        );
      }

      if (id.startsWith(IDS.BUTTONS.DOWNLOAD_SINGLE_PREFIX)) {
        return await EB.handleDownload(interaction, parseEventId(id));
      }

      if (id.startsWith(IDS.BUTTONS.COMPARE_PREFIX)) {
        return await EB.handleCompareButton(interaction, parseEventId(id));
      }

      if (id.startsWith(IDS.BUTTONS.CLEAR_CONFIRM_PREFIX)) {
        return await EB.handleClearEventConfirm(interaction);
      }

      if (id.startsWith(IDS.BUTTONS.CLEAR_ABORT_PREFIX)) {
        return await EB.handleClearEventAbort(interaction);
      }

      if (id.startsWith(IDS.BUTTONS.CLEAR_PREFIX)) {
        return await EB.handleClearEventButton(interaction, parseEventId(id));
      }
    }

    if (interaction.isStringSelectMenu()) {
      const handler = SELECT_HANDLERS[interaction.customId];

      if (handler) {
        logger.emit({
          event: "event_select",
          data: { id: interaction.customId },
        });

        return await handler(interaction);
      }

      if (interaction.customId.startsWith(IDS.SELECTS.COMPARE_SELECT_PREFIX)) {
        return await EB.handleCompareSelect(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      return await handleModal(interaction);
    }

    return false;
  } catch (error: any) {
    logger.emit({
      event: "event_error",
      level: "error",
      data: {
        message: error?.message,
        stack: error?.stack,
      },
    });

    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "❌ An error occurred while processing this interaction.",
        ephemeral: true,
      });
    }

    return true;
  }
}