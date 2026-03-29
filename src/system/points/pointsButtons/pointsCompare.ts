// src/system/points/pointsButtons/pointsCompare.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Placeholder Compare Weeks
// -----------------------------
export async function handleCompareWeeks(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  traceId: string
) {
  try {
    logger.emit({
      scope: "points.button",
      event: "points_compare_triggered",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        type: interaction.isButton() ? "button" : "modal",
      },
    });

    await interaction.reply({
      content: "📊 Compare Weeks – placeholder functionality. To be implemented.",
      ephemeral: true
    });

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_compare_error",
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
        content: "❌ Error while comparing weeks.",
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