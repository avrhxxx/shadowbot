// src/eventsPanel/eventHandlers.ts
import { Interaction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from "discord.js";
import * as EB from "./eventsButtons"; // wszystkie funkcje buttonów, selectów, modali w index.ts
import { parseEventId } from "./eventsButtons/utils";

// CENTRALNE CUSTOM ID
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

// MAPY HANDLERÓW
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

// DYNAMICZNE MODALE
function handleModal(interaction: ModalSubmitInteraction) {
  const { customId } = interaction;

  if (customId === IDS.MODALS.CREATE) return EB.handleCreateSubmit(interaction);
  if (customId.startsWith(IDS.MODALS.ADD_PREFIX))
    return EB.handleAddParticipantSubmit(interaction, parseEventId(customId));
  if (customId.startsWith(IDS.MODALS.REMOVE_PREFIX))
    return EB.handleRemoveParticipantSubmit(interaction, parseEventId(customId));
  if (customId.startsWith(IDS.MODALS.ABSENT_PREFIX))
    return EB.handleAbsentParticipantSubmit(interaction, parseEventId(customId));
}

// GŁÓWNY HANDLER
export async function handleEventInteraction(interaction: Interaction) {
  if (interaction.isButton()) {
    const handler = BUTTON_HANDLERS[interaction.customId];
    if (handler) return handler(interaction);

    // dynamiczne ID buttonów
    if (interaction.customId.startsWith("event_add_"))
      return EB.handleAddParticipant(interaction, parseEventId(interaction.customId));
    if (interaction.customId.startsWith("event_remove_"))
      return EB.handleRemoveParticipant(interaction, parseEventId(interaction.customId));
    if (interaction.customId.startsWith("event_absent_"))
      return EB.handleAbsentParticipant(interaction, parseEventId(interaction.customId));
    if (interaction.customId.startsWith("event_show_list_"))
      return EB.handleShowList(interaction, parseEventId(interaction.customId));
    if (interaction.customId.startsWith("event_download_single_"))
      return EB.handleDownload(interaction, parseEventId(interaction.customId));
    if (interaction.customId.startsWith("event_compare_"))
      return EB.handleCompareButton(interaction, parseEventId(interaction.customId));
    if (interaction.customId.startsWith("event_clear_"))
      return EB.handleClearEventButton(interaction, parseEventId(interaction.customId));
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