// src/absencePanel/absenceInteraction.ts
import { Interaction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, CacheType } from "discord.js";
import * as AB from "./absenceButtons";

export const IDS = {
  BUTTONS: { 
    ADD: "absence_add", 
    REMOVE: "absence_remove", 
    SHOW_LIST: "absence_list", 
    SETTINGS: "absence_settings",
    HELP: "absence_help" // <- dodany Help
  },
  SELECTS: { SETTINGS_NOTIFICATION: "absence_settings_notification" },
  MODALS: { ADD: "absence_add_modal", REMOVE: "absence_remove_modal" },
};

const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  [IDS.BUTTONS.ADD]: async (i) => await AB.handleAddAbsence(i),
  [IDS.BUTTONS.REMOVE]: async (i) => await AB.handleRemoveAbsence(i),
  [IDS.BUTTONS.SHOW_LIST]: async (i) => await AB.handleAbsenceList(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => await AB.handleSettings(i),
  [IDS.BUTTONS.HELP]: async (i) => await AB.handleAbsenceHelp(i), // <- obsługa Help
};

const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction<CacheType>) => Promise<any>> = {
  [IDS.SELECTS.SETTINGS_NOTIFICATION]: async (i) => await AB.handleSettingsSelect(i),
};

async function handleModal(interaction: ModalSubmitInteraction<CacheType>) {
  const { customId } = interaction;
  if (customId === IDS.MODALS.ADD) return await AB.handleAddAbsenceSubmit(interaction);
  if (customId === IDS.MODALS.REMOVE) return await AB.handleRemoveAbsenceSubmit(interaction);
}

export async function handleAbsenceInteraction(interaction: Interaction<CacheType>) {
  try {
    if (interaction.isButton()) {
      const handler = BUTTON_HANDLERS[interaction.customId];
      if (!handler) return;
      return await handler(interaction);
    }
    if (interaction.isStringSelectMenu()) {
      const handler = SELECT_HANDLERS[interaction.customId];
      if (!handler) return;
      return await handler(interaction);
    }
    if (interaction.isModalSubmit()) return await handleModal(interaction);
  } catch (error) {
    console.error("Error handling absence interaction:", error);
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) 
        await interaction.followUp({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
      else 
        await interaction.reply({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
    }
  }
}