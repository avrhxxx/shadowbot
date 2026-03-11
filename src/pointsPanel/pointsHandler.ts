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

    // Przyciski wewnątrz paneli kategorii
    ADD: "points_add",
    LIST: "points_list",
    COMPARE: "points_compare",
    BACK: "points_back"
  }
};

// Mapowanie przycisków na funkcje
const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<void>> = {
  // Główny wybór kategorii
  [IDS.BUTTONS.DONATIONS]: (i) => PB.PBDonations.handleDonationsPanel(i),
  [IDS.BUTTONS.DUEL]: (i) => PB.PBDuel.handleDuelPanel(i),

  // Opcjonalne
  [IDS.BUTTONS.GUIDE]: (i) => PB.handleGuide?.(i) ?? Promise.resolve(),
  [IDS.BUTTONS.SETTINGS]: (i) => PB.handleSettings?.(i) ?? Promise.resolve(),

  // Create / List Weeks
  [IDS.BUTTONS.CREATE_WEEK]: (i) => PB.PBCreate.handleCreateWeek(i),
  [IDS.BUTTONS.LIST_WEEKS]: (i) => PB.PBListWeeks.handleListWeeks(i),

  // Przyciski wewnątrz paneli kategorii
  [IDS.BUTTONS.ADD]: (i) => PS.handleAddPoints(i),
  [IDS.BUTTONS.LIST]: (i) => PS.handlePointsList(i),
  [IDS.BUTTONS.COMPARE]: (i) => PS.handleCompareWeeks(i),
  [IDS.BUTTONS.BACK]: (i) => PB.handleBackToCategory?.(i) ?? Promise.resolve()
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
      const replyPayload = { content: "❌ An error occurred.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    }
  }
}