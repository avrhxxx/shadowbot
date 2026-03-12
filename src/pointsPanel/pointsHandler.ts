// src/pointsPanel/pointsHandler.ts
import { Interaction, ButtonInteraction, CacheType } from "discord.js";
import * as PB from "./pointsButtons";
import * as PS from "./pointsService";

export const IDS = {
  BUTTONS: {
    DONATIONS: "points_category_donations",
    DUEL: "points_category_duel",

    GUIDE: "points_guide",
    SETTINGS: "points_settings",

    CREATE_WEEK: "points_create_week",
    LIST_WEEKS: "points_list_weeks",

    ADD: "points_add",
    LIST: "points_list",
    COMPARE: "points_compare"
  }
};

// Mapowanie przycisków na funkcje
const BUTTON_HANDLERS: Record<
  string,
  (i: ButtonInteraction<CacheType>) => Promise<void>
> = {
  // Kategorie
  [IDS.BUTTONS.DONATIONS]: (i) =>
    PB.pointsDonations.handlePointsDonations(i),

  [IDS.BUTTONS.DUEL]: (i) =>
    PB.pointsDuel.handlePointsDuel(i),

  // Placeholdery (do zrobienia później)
  [IDS.BUTTONS.GUIDE]: async (i) => {
    await i.reply({
      content: "📖 Guide not implemented yet.",
      ephemeral: true
    });
  },

  [IDS.BUTTONS.SETTINGS]: async (i) => {
    await i.reply({
      content: "⚙️ Settings not implemented yet.",
      ephemeral: true
    });
  },

  // Week system
  [IDS.BUTTONS.CREATE_WEEK]: (i) =>
    PB.pointsCreate.handleCreateWeekCategory(i, "unknown_category"),

  [IDS.BUTTONS.LIST_WEEKS]: (i) =>
    PB.pointsListWeeks.handleListWeeks(i),

  // Actions
  [IDS.BUTTONS.ADD]: (i) => PS.handleAddPoints(i),

  [IDS.BUTTONS.LIST]: (i) => PS.handlePointsList(i),

  [IDS.BUTTONS.COMPARE]: (i) => PS.handleCompareWeeks(i)
};

// Globalny handler dla panelu
export async function handlePointsInteraction(
  interaction: Interaction<CacheType>
) {
  try {
    if (!interaction.isButton()) return;

    const handler = BUTTON_HANDLERS[interaction.customId];
    if (!handler) return;

    await handler(interaction);
  } catch (error) {
    console.error("Error handling points interaction:", error);

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ An error occurred.",
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}