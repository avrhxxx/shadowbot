// src/pointsPanel/pointsHandler.ts
import { Interaction, ButtonInteraction, CacheType, ModalSubmitInteraction } from "discord.js";
import * as PB from "./pointsButtons";
import * as PS from "./pointsService";
import * as Utils from "./pointsButtons/utils";

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
const BUTTON_HANDLERS: Record<string, (i: ButtonInteraction<CacheType>) => Promise<void>> = {
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
    // 1️⃣ Button
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Global button handlers
      if (BUTTON_HANDLERS[customId]) {
        await BUTTON_HANDLERS[customId](interaction);
        return;
      }

      // Kliknięcie kategorii w Points Management
      if (customId.startsWith("points_management_category_")) {
        await PB.pointsManagement.handlePointsManagement(interaction);
        return;
      }

      // ----- Create Week -----
      if (Utils.isCreateWeek(customId)) {
        await PB.pointsCreate.handleCreateWeek(interaction);
        return;
      }

      // ----- Kliknięcie tygodnia -----
      if (Utils.isWeek(customId)) {
        const { category, week } = Utils.parseWeekId(customId);
        const module = getCategoryModule(category);
        if (module) {
          await module.handleWeekClick(interaction, week);
        } else {
          await safeReply(interaction, { content: `⚠️ Unknown category: ${category}`, ephemeral: true });
        }
        return;
      }

      // ----- Add / Remove / List / Compare -----
      if (Utils.isAction(customId)) {
        const { action, category, week } = Utils.parseActionId(customId) as { action: ActionType; category: string; week: string };
        const module = getCategoryModule(category);
        if (!module) {
          await safeReply(interaction, { content: `⚠️ Unknown category: ${category}`, ephemeral: true });
          return;
        }

        switch (action) {
          case "add": await PS.handleAddPoints(interaction); break;
          case "remove": await PS.handleRemovePoints(interaction); break;
          case "list": await PS.handlePointsList(interaction); break;
          case "compare": await PS.handleCompareWeeks(interaction); break;
        }
        return;
      }
    }

    // 2️⃣ Modal Submit
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      if (customId.startsWith("points_create_modal_")) {
        await PB.pointsCreate.handleCreateWeekSubmit(interaction);
        return;
      }
    }
  } catch (error) {
    console.error("Error handling points interaction:", error);
    if (interaction.isRepliable()) {
      const payload = { content: "❌ An error occurred.", ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
      else await interaction.reply(payload);
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

// -----------------------------
// CATEGORY MODULE ROUTER
// -----------------------------
function getCategoryModule(category: string) {
  switch (category) {
    case "donations": return PB.pointsDonations;
    case "duel": return PB.pointsDuel;
    default: return null;
  }
}