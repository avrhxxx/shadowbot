// src/system/points/pointsButtons/pointsDonations.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle } from "discord.js";
import * as pointsService from "../pointsService";
import { logger } from "../../../core/logger/log";

// -----------------------------
// Render wszystkich tygodni dla kategorii Donations
// -----------------------------
export async function renderWeeks(): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  const weeks = await pointsService.getAllWeeks("Donations");

  return weeks.map(week => {
    const safeWeek = encodeURIComponent(week);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_donations_${safeWeek}`)
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
    logger.emit({
      scope: "points.button",
      event: "points_week_click",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        week,
      },
    });

    // ✅ DeferUpdate, żeby Discord nie zgłaszał błędu
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }

    // Pobranie aktualnych punktów
    const points = await pointsService.getPoints("Donations", week);
    const pointsText = points.length > 0 
      ? points.map(p => `${p.nick}: ${p.points}`).join("\n")
      : "_No points recorded yet_";

    // Przyciski akcji
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_add_donations_${encodeURIComponent(week)}`)
        .setLabel("Add Points")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_remove_donations_${encodeURIComponent(week)}`)
        .setLabel("Remove Points")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`points_compare_donations_${encodeURIComponent(week)}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_list_donations_${encodeURIComponent(week)}`)
        .setLabel("List")
        .setStyle(ButtonStyle.Primary)
    );

    // ✅ Bezpieczne reply/edit
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `📌 Donations – Week ${week}\n\n${pointsText}`,
        components: [row]
      });
    } else {
      await interaction.reply({
        content: `📌 Donations – Week ${week}\n\n${pointsText}`,
        components: [row],
        ephemeral: true
      });
    }

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_week_click_error",
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
        content: "❌ Error while loading week data.",
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
export function createWeekButton(category = "donations") {
  return new ButtonBuilder()
    .setCustomId(`points_create_week_${category}`)
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success);
}