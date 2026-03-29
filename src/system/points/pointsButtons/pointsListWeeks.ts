// src/system/points/pointsButtons/pointsListWeeks.ts
import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";
import { logger } from "../../../core/logger/log";

/**
 * Placeholder: Wyświetla listę wszystkich stworzonych tygodni
 */
export async function handleListWeeks(
  interaction: ButtonInteraction<CacheType>,
  traceId: string
): Promise<void> {
  try {
    logger.emit({
      scope: "points.button",
      event: "points_list_weeks_triggered",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      },
    });

    // Pobieramy wszystkie tygodnie
    const weeks: string[] = await pointsService.getAllWeeks();

    if (!weeks.length) {
      await interaction.reply({
        content: "⚠️ No weeks created yet (placeholder).",
        ephemeral: true
      });
      return;
    }

    const weekList = weeks
      .map((week: string, index: number) => `${index + 1}. ${week}`)
      .join("\n");

    await interaction.reply({
      content: `📋 **Created Weeks (placeholder):**\n${weekList}`,
      ephemeral: true
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
        guildId: interaction.guildId,
      },
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Failed to fetch weeks.",
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