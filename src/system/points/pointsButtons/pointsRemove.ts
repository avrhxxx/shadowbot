
// src/system/points/pointsButtons/pointsRemove.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Placeholder Remove Points
// -----------------------------
export async function handleRemovePoints(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  traceId: string
) {
  try {
    logger.emit({
      scope: "points.button",
      event: "points_remove_triggered",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        type: interaction.isButton() ? "button" : "modal",
      },
    });

    const payload = {
      content: "🔴 Remove Points – placeholder functionality. To be implemented.",
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
      event: "points_remove_error",
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
        content: "❌ Error while removing points.",
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