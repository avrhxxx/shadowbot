// src/moderatorPanel/pointsPanel/pointsInteraction.ts
import { Interaction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, CacheType } from "discord.js";
import * as PB from "./pointsButtons"; // Tutaj później będziemy mieć np. handleAddPoints, handlePointsList itd.

export const IDS = {
  BUTTONS: {
    DONATIONS: "points_category_donations",  // wybór kategorii
    DUEL: "points_category_duel",
    ADD: "points_add",
    LIST: "points_list",
    COMPARE: "points_compare",
    HELP: "points_help",
    SETTINGS: "points_settings",
  },
  SELECTS: {
    WEEK_SELECT: "points_week_select", // np. wybór tygodnia
  },
  MODALS: {
    ADD: "points_add_modal",
  },
};

const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  [IDS.BUTTONS.DONATIONS]: async (i) => await PB.handleDonationsCategory(i),
  [IDS.BUTTONS.DUEL]: async (i) => await PB.handleDuelCategory(i),
  [IDS.BUTTONS.ADD]: async (i) => await PB.handleAddPoints(i),
  [IDS.BUTTONS.LIST]: async (i) => await PB.handlePointsList(i),
  [IDS.BUTTONS.COMPARE]: async (i) => await PB.handleCompareWeeks(i),
  [IDS.BUTTONS.HELP]: async (i) => await PB.handlePointsHelp(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => await PB.handlePointsSettings(i),
};

const SELECT_HANDLERS: Record<string, (i: StringSelectMenuInteraction<CacheType>) => Promise<any>> = {
  [IDS.SELECTS.WEEK_SELECT]: async (i) => await PB.handleWeekSelect(i),
};

async function handleModal(interaction: ModalSubmitInteraction<CacheType>) {
  const { customId } = interaction;
  if (customId === IDS.MODALS.ADD) return await PB.handleAddPointsSubmit(interaction);
}

export async function handlePointsInteraction(interaction: Interaction<CacheType>) {
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
    console.error("Error handling points interaction:", error);
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) 
        await interaction.followUp({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
      else 
        await interaction.reply({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
    }
  }
}