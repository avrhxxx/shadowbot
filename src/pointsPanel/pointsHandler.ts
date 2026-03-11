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

    // Create / List Weeks w panelu głównym
    CREATE_WEEK: "points_create_week",
    LIST_WEEKS: "points_list_weeks",

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
  [IDS.BUTTONS.DONATIONS]: async (i) => await PB.PBDonations.handleDonationsPanel(i),
  [IDS.BUTTONS.DUEL]: async (i) => await PB.PBDuel.handleDuelPanel(i),
  [IDS.BUTTONS.GUIDE]: async (i) => await PB.handleGuide?.(i),
  [IDS.BUTTONS.SETTINGS]: async (i) => await PB.handleSettings?.(i),

  // Create / List Weeks
  [IDS.BUTTONS.CREATE_WEEK]: async (i) => await PB.PBCreate.handleCreateWeek(i),
  [IDS.BUTTONS.LIST_WEEKS]: async (i) => await PB.PBListWeeks.handleListWeeks(i),

  // Przyciski wewnątrz paneli kategorii
  [IDS.BUTTONS.ADD]: async (i) => await PS.handleAddPoints(i),
  [IDS.BUTTONS.LIST]: async (i) => await PS.handlePointsList(i),
  [IDS.BUTTONS.COMPARE]: async (i) => await PS.handleCompareWeeks(i),
  [IDS.BUTTONS.BACK]: async (i) => await PB.handleBackToCategory?.(i)
};

// Globalny handler dla wszystkich przycisków w Points Panel
export async function handlePointsInteraction(interaction: Interaction<CacheType>) {
  try {
    if (!interaction.isButton()) return;

    const handler = BUTTON_HANDLERS[interaction.customId];
    if (!handler) return;

    await handler(interaction);
  } catch (error) {
    console.error("Error handling points interaction:", error);
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "❌ An error occurred.", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
      }
    }
  }
}