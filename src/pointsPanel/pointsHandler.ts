// src/pointsPanel/pointsHandler.ts
import { Interaction, ButtonInteraction, CacheType } from "discord.js";
import * as PB from "./pointsButtons";
import * as PS from "./pointsService";

export const IDS = {
  BUTTONS: {
    // Główny panel kategorii
    DONATIONS: "points_category_donations",
    DUEL: "points_category_duel",
    GUIDE: "points_guide",
    SETTINGS: "points_settings",
    // Przyciski w panelach kategorii
    ADD: "points_add",
    LIST: "points_list",
    COMPARE: "points_compare",
    BACK: "points_back"
  }
};

// Mapowanie przycisków na funkcje
const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<any>> = {
  // Główny wybór kategorii
  [IDS.BUTTONS.DONATIONS]: async (i) => await PB.handleDonationsPanel(i),
  [IDS.BUTTONS.DUEL]: async (i) => await PB.handleDuelPanel(i),
  [IDS.BUTTONS.GUIDE]: async (i) => await PB.handleGuide(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => await PB.handleSettings(i),

  // Przykładowe przyciski w panelach (możesz rozszerzać)
  [IDS.BUTTONS.ADD]: async (i) => await PS.handleAddPoints(i),
  [IDS.BUTTONS.LIST]: async (i) => await PS.handlePointsList(i),
  [IDS.BUTTONS.COMPARE]: async (i) => await PS.handleCompareWeeks(i),
  [IDS.BUTTONS.BACK]: async (i) => await PB.handleBackToCategory(i)
};

// Globalny handler dla interakcji w pointsPanel
export async function handlePointsInteraction(interaction: Interaction<CacheType>) {
  try {
    if (!interaction.isButton()) return;

    const handler = BUTTON_HANDLERS[interaction.customId];
    if (!handler) return;

    await handler(interaction);
  } catch (error) {
    console.error("Error handling points interaction:", error);
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred)
        await interaction.followUp({ content: "❌ An error occurred.", ephemeral: true });
      else
        await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
    }
  }
}