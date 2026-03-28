// src/pointsPanel/pointsHandler.ts
import {
  Interaction,
  ButtonInteraction,
  CacheType,
  ModalSubmitInteraction
} from "discord.js";

import * as PB from "./pointsButtons";
import * as PS from "./pointsService";
import * as Utils from "./pointsButtons/utils";
import { logger } from "../core/logger/log";

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
  [IDS.BUTTONS.POINTS_MANAGEMENT]: (i) =>
    PB.pointsManagement.handlePointsManagementMain(i),

  [IDS.BUTTONS.GUIDE]: async (i) => {
    await safeReply(i, {
      content: "📖 Guide not implemented yet.",
      ephemeral: true
    });
  },

  [IDS.BUTTONS.SETTINGS]: async (i) => {
    await safeReply(i, {
      content: "⚙️ Settings not implemented yet.",
      ephemeral: true
    });
  },

  [IDS.BUTTONS.LIST_WEEKS]: (i) =>
    PB.pointsListWeeks.handleListWeeks(i)
};

// -----------------------------
// GLOBAL INTERACTION HANDLER
// -----------------------------
export async function handlePointsInteraction(
  interaction: Interaction<CacheType>
): Promise<boolean> {
  try {
    // =============================
    // 🔘 BUTTONS
    // =============================
    if (interaction.isButton()) {
      const { customId } = interaction;

      logger.emit({
        event: "points_button",
        data: {
          context: { id: customId }
        }
      });

      // STATIC BUTTONS
      const handler = BUTTON_HANDLERS[customId];
      if (handler) {
        await handler(interaction);
        return true;
      }

      // CATEGORY CLICK
      if (customId.startsWith("points_management_category_")) {
        await PB.pointsManagement.handlePointsManagement(interaction);
        return true;
      }

      // CREATE WEEK
      if (Utils.isCreateWeek(customId)) {
        await PB.pointsCreate.handleCreateWeek(interaction);
        return true;
      }

      // WEEK CLICK
      if (Utils.isWeek(customId)) {
        const { category, week } = Utils.parseWeekId(customId);
        const module = getCategoryModule(category);

        if (!module) {
          logger.emit({
            event: "points_unknown_category",
            level: "warn",
            data: {
              context: { category }
            }
          });

          await safeReply(interaction, {
            content: `⚠️ Unknown category: ${category}`,
            ephemeral: true
          });
          return true;
        }

        await module.handleWeekClick(interaction, week);
        return true;
      }

      // ACTIONS
      if (Utils.isAction(customId)) {
        const parsed = Utils.parseActionId(customId);

        if (!parsed) {
          logger.emit({
            event: "points_invalid_action",
            level: "warn",
            data: {
              context: { customId }
            }
          });

          await safeReply(interaction, {
            content: "⚠️ Invalid action format.",
            ephemeral: true
          });
          return true;
        }

        const { action, category } = parsed as {
          action: ActionType;
          category: string;
          week: string;
        };

        const module = getCategoryModule(category);

        if (!module) {
          logger.emit({
            event: "points_unknown_category",
            level: "warn",
            data: {
              context: { category }
            }
          });

          await safeReply(interaction, {
            content: `⚠️ Unknown category: ${category}`,
            ephemeral: true
          });
          return true;
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

        return true;
      }

      return false;
    }

    // =============================
    // 🧾 MODALS
    // =============================
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      logger.emit({
        event: "points_modal",
        data: {
          context: { id: customId }
        }
      });

      if (customId.startsWith("points_create_modal_")) {
        await PB.pointsCreate.handleCreateWeekSubmit(interaction);
        return true;
      }

      return false;
    }

    return false;
  } catch (error) {
    logger.emit({
      event: "points_error",
      level: "error",
      data: {
        error
      }
    });

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

    return true;
  }
}

// -----------------------------
// HELPERS
// -----------------------------
function safeReply(
  interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>,
  payload: any
) {
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

// -----------------------------
// CATEGORY MODULE ROUTER
// -----------------------------
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