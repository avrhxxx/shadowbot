// src/system/points/pointsButtons/pointsAdd.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Placeholder Add Points
// -----------------------------
export async function handleAddPoints(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  traceId: string
) {
  try {
    logger.emit({
      scope: "points.button",
      event: "points_add_triggered",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        type: interaction.isButton() ? "button" : "modal",
      },
    });

    const payload = {
      content: "🟢 Add Points – placeholder functionality. To be implemented.",
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
      event: "points_add_error",
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
        content: "❌ Error while adding points.",
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