import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

// Pobranie kategorii i tygodnia z customId przycisku
export async function handleSelectWeek(interaction: ButtonInteraction<CacheType>) {
  const match = interaction.customId.match(/^points_week_(donations|duel)_(.+)$/);
  if (!match) return;

  const category = match[1];
  const week = match[2];

  if (category === "donations") {
    await pointsDonations.handleWeekClick(interaction, week);
  } else if (category === "duel") {
    await pointsDuel.handleWeekClick(interaction, week);
  }
}