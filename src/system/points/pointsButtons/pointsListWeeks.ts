// src/system/points/pointsButtons/pointsListWeeks.ts
import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Helper (spójny z resztą systemu)
// -----------------------------
function safeReply(
  interaction: ButtonInteraction<CacheType>,
  payload: any
) {
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload);
  }
  return interaction.reply(payload);
}

/**
 * Placeholder: Wyświetla listę wszystkich stworzonych tygodni
 */
export async function handleListWeeks(
  interaction: ButtonInteraction<CacheType>,
  traceId: string
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await safeReply(interaction, {
      content: "❌ Guild context is required.",
      ephemeral: true,
    });
    return;
  }

  try {
    logger.emit({
      scope: "points.button",
      event: "points_list_weeks_triggered",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId,
      },
    });

    const weeks: string[] = await pointsService.getAllWeeks(guildId);

    if (!weeks.length) {
      await safeReply(interaction, {
        content: "⚠️ No weeks created yet.",
        ephemeral: true,
      });
      return;
    }

    const weekList = weeks
      .map((week: string, index: number) => `${index + 1}. ${week}`)
      .join("\n");

    await safeReply(interaction, {
      content: `📋 **Created Weeks:**\n${weekList}`,
      ephemeral: true,
    });

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_list_weeks_error",
      traceId,
      level: "error",
      error,
      context: {
        userId: interaction.user.id,
        guildId,
      },
    });

    if (interaction.isRepliable()) {
      await safeReply(interaction, {
        content: "❌ Failed to fetch weeks.",
        ephemeral: true,
      });
    }
  }
}