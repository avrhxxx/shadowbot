// src/pointsPanel/pointsHandler.ts
import { Interaction, ButtonInteraction, CacheType } from "discord.js";
import * as PB from "./pointsButtons";
import * as PS from "./pointsService";

export const IDS = {
  BUTTONS: {
    GUIDE: "points_guide",
    SETTINGS: "points_settings",
    POINTS_MANAGEMENT: "points_management",
    LIST_WEEKS: "points_list_weeks"
  },
  ACTIONS: ["add", "remove", "list", "compare"] as const
};

type ActionType = typeof IDS.ACTIONS[number];

// -----------------------------
// GLOBAL BUTTON HANDLERS
// -----------------------------
const BUTTON_HANDLERS: Record<
  string,
  (i: ButtonInteraction<CacheType>) => Promise<void>
> = {
  [IDS.BUTTONS.POINTS_MANAGEMENT]: (i) => PB.pointsManagement.handlePointsManagementMain(i),
  [IDS.BUTTONS.GUIDE]: async (i) => {
    await i.reply({ content: "📖 Guide not implemented yet.", ephemeral: true });
  },
  [IDS.BUTTONS.SETTINGS]: async (i) => {
    await i.reply({ content: "⚙️ Settings not implemented yet.", ephemeral: true });
  },
  [IDS.BUTTONS.LIST_WEEKS]: (i) => PB.pointsListWeeks.handleListWeeks(i)
};

// -----------------------------
// GLOBAL INTERACTION HANDLER
// -----------------------------
export async function handlePointsInteraction(interaction: Interaction<CacheType>) {
  try {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    // 1️⃣ Stałe przyciski
    if (BUTTON_HANDLERS[customId]) {
      await BUTTON_HANDLERS[customId](interaction);
      return;
    }

    // 2️⃣ Dynamiczne tygodnie i akcje w formacie: points_<category>_week_<week>
    const weekMatch = customId.match(/^points_(.+)_week_(.+)$/);
    if (weekMatch) {
      const [, category, week] = weekMatch;
      const module = getCategoryModule(category);
      if (module) {
        await module.handleWeekClick(interaction, week);
      } else {
        await safeReply(interaction, { content: `⚠️ Unknown category: ${category}`, ephemeral: true });
      }
      return;
    }

    // 3️⃣ Dynamiczne akcje Add/Remove/List/Compare: points_<action>_<category>_<week>
    const actionMatch = customId.match(/^points_(add|remove|list|compare)_(.+)_(.+)$/);
    if (actionMatch) {
      const [, action, category, week] = actionMatch as [string, ActionType, string, string];
      const module = getCategoryModule(category);

      if (!module) {
        await safeReply(interaction, { content: `⚠️ Unknown category: ${category}`, ephemeral: true });
        return;
      }

      switch (action) {
        case "add":
          await PS.handleAddPoints(interaction);
          break;
        case "remove":
          await PS.handleRemovePoints(interaction);
          break;
        case "list":
          await PS.handlePointsList(interaction);
          break;
        case "compare":
          await PS.handleCompareWeeks(interaction);
          break;
      }
      return;
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

// -----------------------------
// HELPERS
// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// Funkcja zwracająca moduł kategorii (donations, duel, etc.)
function getCategoryModule(category: string) {
  switch (category) {
    case "donations":
      return PB.pointsDonations;
    case "duel":
      return PB.pointsDuel;
    default:
      return null;
  }
}