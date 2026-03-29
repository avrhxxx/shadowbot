// src/system/points/pointsButtons/pointsList.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Placeholder Points List
// -----------------------------
export async function handlePointsList(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  traceId: string
) {
  try {
    logger.emit({
      scope: "points.button",
      event: "points_list_triggered",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        type: interaction.isButton() ? "button" : "modal",
      },
    });

    const payload = {
      content: "📋 Points List – placeholder functionality. To be implemented.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_list_error",
      traceId,
      level: "error",
      error,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      },
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Error while loading points list.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}