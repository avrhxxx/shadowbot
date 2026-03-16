// src/pointsPanel/pointsButtons/pointsSelectWeek.ts
import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

/**
 * Obsługa kliknięcia przycisku tygodnia.
 * Pobiera kategorię i tydzień z customId i deleguje do odpowiedniego modułu.
 */
export async function handleSelectWeek(interaction: ButtonInteraction<CacheType>) {
  const match = interaction.customId.match(/^points_week_(donations|duel)_(.+)$/);
  if (!match) return;

  const category = match[1];
  const week = match[2];

  // Delegujemy do odpowiedniego modułu
  switch (category) {
    case "donations":
      await pointsDonations.handleWeekClick(interaction, week);
      break;
    case "duel":
      await pointsDuel.handleWeekClick(interaction, week);
      break;
    default:
      // Bezpieczny fallback
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: `⚠️ Unknown category: ${category}`, ephemeral: true });
      } else {
        await interaction.reply({ content: `⚠️ Unknown category: ${category}`, ephemeral: true });
      }
      break;
  }
}