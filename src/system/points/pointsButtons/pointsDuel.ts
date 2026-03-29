// src/system/points/pointsButtons/pointsDuel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle } from "discord.js";
import * as pointsService from "../pointsService";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Render wszystkich tygodni dla kategorii Duel
// -----------------------------
export async function renderWeeks(
  guildId: string
): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  const weeks = await pointsService.getAllWeeks(guildId, "Duel");

  return weeks.map((week: string) => {
    const safeWeek = encodeURIComponent(week);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_duel_${safeWeek}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    );
  });
}

// -----------------------------
// Obsługa kliknięcia przycisku tygodnia
// -----------------------------
export async function handleWeekClick(
  interaction: ButtonInteraction<CacheType>,
  week: string,
  traceId: string
) {
  try {
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({
        content: "❌ Guild not found.",
        ephemeral: true
      });
      return;
    }

    logger.emit({
      scope: "points.button",
      event: "points_week_click_duel",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId,
        week,
      },
    });

    // ✅ Defer żeby uniknąć "interaction failed"
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }

    // 🔥 Pobranie punktów (spójne z Donations)
    const points = await pointsService.getPoints(
      guildId,
      "Duel",
      week
    );

    const pointsText = points.length > 0
      ? points.map((p) => `${p.nick}: ${p.points}`).join("\n")
      : "_No points recorded yet_";

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_add_duel_${encodeURIComponent(week)}`)
        .setLabel("Add Points")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_remove_duel_${encodeURIComponent(week)}`)
        .setLabel("Remove Points")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`points_compare_duel_${encodeURIComponent(week)}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_list_duel_${encodeURIComponent(week)}`)
        .setLabel("List")
        .setStyle(ButtonStyle.Primary)
    );

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: `📌 Duel – Week ${week}\n\n${pointsText}`,
        components: [row]
      });
    } else {
      await interaction.reply({
        content: `📌 Duel – Week ${week}\n\n${pointsText}`,
        components: [row],
        ephemeral: true
      });
    }

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_week_click_duel_error",
      traceId,
      level: "error",
      error,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        week,
      },
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Error while loading duel week.",
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

// -----------------------------
// Przygotowanie przycisku Create Week
// -----------------------------
export function createWeekButton(category = "duel") {
  return new ButtonBuilder()
    .setCustomId(`points_create_week_${category}`)
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success);
}