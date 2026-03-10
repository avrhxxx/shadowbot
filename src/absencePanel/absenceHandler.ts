import {
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CacheType,
} from "discord.js";

import * as AB from "./absenceButtons";

// ----------------------------
// IDs
// ----------------------------
export const IDS = {
  BUTTONS: {
    ADD: "absence_add",
    REMOVE: "absence_remove",
    SHOW_LIST: "absence_show_list",
    SETTINGS: "absence_settings",
  },
  SELECTS: {
    SETTINGS_NOTIFICATION: "absence_settings_notification",
  },
  MODALS: {
    ADD: "absence_add_modal",
    REMOVE: "absence_remove_modal",
  },
};

// ----------------------------
// Button handlers
// ----------------------------
const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  [IDS.BUTTONS.ADD]: AB.handleAddAbsence,
  [IDS.BUTTONS.REMOVE]: AB.handleRemoveAbsence,
  [IDS.BUTTONS.SHOW_LIST]: AB.handleShowAbsences,
  [IDS.BUTTONS.SETTINGS]: AB.handleSettings,
};

// ----------------------------
// Select handlers
// ----------------------------
const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction<CacheType>) => Promise<any>> = {
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: AB.handleSettingsSelect,
};

// ----------------------------
// Modal handler
// ----------------------------
async function handleModal(interaction: ModalSubmitInteraction<CacheType>) {
  const { customId } = interaction;

  if (customId === IDS.MODALS.ADD) return await AB.handleAddAbsenceSubmit(interaction);
  if (customId === IDS.MODALS.REMOVE) return await AB.handleRemoveAbsenceSubmit(interaction);
}

// ----------------------------
// Main interaction handler
// ----------------------------
export async function handleAbsenceInteraction(interaction: Interaction<CacheType>) {
  try {
    if (interaction.isButton()) {
      const handler = BUTTON_HANDLERS[interaction.customId];
      if (!handler) return;
      return await handler(interaction); // funkcja sama wywoła modal/reply
    }

    if (interaction.isStringSelectMenu()) {
      const handler = SELECT_HANDLERS[interaction.customId];
      if (!handler) return;
      return await handler(interaction);
    }

    if (interaction.isModalSubmit()) {
      return await handleModal(interaction);
    }

  } catch (error) {
    console.error("Error handling absence interaction:", error);

    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "❌ An error occurred while processing this interaction.",
        ephemeral: true,
      });
    }
  }
}