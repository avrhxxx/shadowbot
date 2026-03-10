// src/absencePanel/absenceHandler.ts
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
    SHOW_LIST: "absence_list", // <- dopasowane do nowego przycisku
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
  [IDS.BUTTONS.ADD]: async (i) => await AB.handleAddAbsence(i),
  [IDS.BUTTONS.REMOVE]: async (i) => await AB.handleRemoveAbsence(i),
  [IDS.BUTTONS.SHOW_LIST]: async (i) => await AB.handleAbsenceList(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => await AB.handleSettings(i),
};

// ----------------------------
// Select handlers
// ----------------------------
const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction<CacheType>) => Promise<any>> = {
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: async (i) => await AB.handleSettingsSelect(i),
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

      // **Nie deferReply przy showModal** — modal Submit będzie osobną interakcją
      return await handler(interaction);
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