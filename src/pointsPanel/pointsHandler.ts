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

    POINTS_MANAGEMENT: "points_management",

    ADD: "points_add",
    REMOVE: "points_remove",
    LIST: "points_list",
    COMPARE: "points_compare"
  }
};

// Mapowanie stałych przycisków
const BUTTON_HANDLERS: Record<
  string,
  (i: ButtonInteraction<CacheType>) => Promise<void>
> = {
  [IDS.BUTTONS.DONATIONS]: (i) => PB.pointsDonations.handlePointsDonations(i),
  [IDS.BUTTONS.DUEL]: (i) => PB.pointsDuel.handlePointsDuel(i),

  [IDS.BUTTONS.POINTS_MANAGEMENT]: (i) =>
    PB.pointsManagement.handlePointsManagementMain(i),

  [IDS.BUTTONS.GUIDE]: async (i) => {
    await i.reply({ content: "📖 Guide not implemented yet.", ephemeral: true });
  },

  [IDS.BUTTONS.SETTINGS]: async (i) => {
    await i.reply({ content: "⚙️ Settings not implemented yet.", ephemeral: true });
  },

  [IDS.BUTTONS.CREATE_WEEK]: (i) =>
    PB.pointsCreate.handleCreateWeekCategory(i, "unknown_category"),

  [IDS.BUTTONS.LIST_WEEKS]: (i) => PB.pointsListWeeks.handleListWeeks(i),

  [IDS.BUTTONS.ADD]: (i) => PS.handleAddPoints(i),        // placeholder
  [IDS.BUTTONS.REMOVE]: (i) => PS.handleRemovePoints(i),  // placeholder
  [IDS.BUTTONS.LIST]: (i) => PS.handlePointsList(i),      // placeholder
  [IDS.BUTTONS.COMPARE]: (i) => PS.handleCompareWeeks(i)  // placeholder
};

// Globalny handler panelu
export async function handlePointsInteraction(
  interaction: Interaction<CacheType>
) {
  try {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    // 1️⃣ dynamiczny tydzień Donations
    if (customId.startsWith("points_donations_week_")) {
      const week = customId.replace("points_donations_week_", "");
      await PB.pointsDonations.handleWeekClick(interaction, week);
      return;
    }

    // 2️⃣ dynamiczny tydzień Duel
    if (customId.startsWith("points_duel_week_")) {
      const week = customId.replace("points_duel_week_", "");
      await PB.pointsDuel.handleWeekClick(interaction, week);
      return;
    }

    // 3️⃣ dynamiczne kliknięcia Add/Remove/Compare/List z tygodni
    const actionMatch = customId.match(
      /^points_(add|remove|compare|list)_(donations|duel)_(.+)$/
    );
    if (actionMatch) {
      const [, action, category, week] = actionMatch;

      switch (action) {
        case "add":
          await PS.handleAddPoints(interaction);      // placeholder
          break;
        case "remove":
          await PS.handleRemovePoints(interaction);   // placeholder
          break;
        case "compare":
          await PS.handleCompareWeeks(interaction);   // placeholder
          break;
        case "list":
          await PS.handlePointsList(interaction);     // placeholder
          break;
      }
      return;
    }

    // 4️⃣ jeśli to stały przycisk
    const handler = BUTTON_HANDLERS[customId];
    if (handler) {
      await handler(interaction);
    }
  } catch (error) {
    console.error("Error handling points interaction:", error);

    if (interaction.isRepliable()) {
      const payload = { content: "❌ An error occurred.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}