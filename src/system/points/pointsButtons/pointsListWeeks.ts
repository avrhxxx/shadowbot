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
  const guildId = interaction.guildId;

  if (!guildId) {
    const payload = {
      content: "❌ Guild context is required.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
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

    // 🔥 FIX: wymagany guildId
    const weeks: string[] = await pointsService.getAllWeeks(guildId);

    if (!weeks.length) {
      const payload = {
        content: "⚠️ No weeks created yet.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
      return;
    }

    const weekList = weeks
      .map((week: string, index: number) => `${index + 1}. ${week}`)
      .join("\n");

    const payload = {
      content: `📋 **Created Weeks:**\n${weekList}`,
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }

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