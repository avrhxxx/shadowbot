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

const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction) => Promise<void>> = {
  [IDS.BUTTONS.CREATE]: EB.handleCreate,
  [IDS.BUTTONS.LIST]: EB.handleList,
  [IDS.BUTTONS.CANCEL]: EB.handleCancel,
  [IDS.BUTTONS.CANCEL_ABORT]: EB.handleCancelAbort,
  [IDS.BUTTONS.SETTINGS]: EB.handleSettings,
  [IDS.BUTTONS.HELP]: EB.handleHelp,
  [IDS.BUTTONS.MANUAL_REMINDER]: EB.handleManualReminder,
};

const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction) => Promise<void>> = {
  [IDS.SELECTS.MANUAL_REMINDER]: EB.handleManualReminderSelect,
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: EB.handleSettingsSelect,
  [IDS.SELECTS.SETTINGS_DOWNLOAD]: EB.handleSettingsSelect,
  [IDS.SELECTS.CANCEL_SELECT]: EB.handleCancelSelect,
};

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

export async function handleEventInteraction(interaction: Interaction) {

  if (interaction.isButton()) {
    const id = interaction.customId;

    // ----------------------------
    // Stałe buttony
    // ----------------------------
    const handler = BUTTON_HANDLERS[id];
    if (handler) return handler(interaction);

    // ----------------------------
    // Nowe przyciski Create event
    // ----------------------------
    if (id.startsWith("notify_create_yes") || id.startsWith("notify_create_no")) {
      return EB.handleNotificationResponse(interaction);
    }

    if (id.startsWith("next_year_yes") || id.startsWith("next_year_no")) {
      // rozdzielamy tylko pierwszy myślnik, reszta pozostaje w tempId
      const [, tempId] = id.split(/-(.+)/);
      if (!tempId) return;

      if (id.startsWith("next_year_yes")) return EB.finalizeNextYearEvent(interaction, tempId);
      if (id.startsWith("next_year_no")) return EB.handleCancelAbort(interaction);
    }

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

  if (interaction.isStringSelectMenu()) {
    const handler = SELECT_HANDLERS[interaction.customId];
    if (handler) return handler(interaction);

    if (interaction.customId.startsWith(IDS.SELECTS.COMPARE_SELECT_PREFIX))
      return EB.handleCompareSelect(interaction);
  }

  if (interaction.isModalSubmit()) {
    return handleModal(interaction);
  }
}