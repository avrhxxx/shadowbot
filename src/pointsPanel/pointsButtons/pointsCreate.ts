import { ButtonInteraction, CacheType, ModalSubmitInteraction } from "discord.js";
import * as pointsService from "../pointsService";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  const category = interaction.customId.replace("points_create_week_", "");

  // Tworzymy przykładowy tydzień
  const weekName = `Week 01`; // w praktyce można generować kolejny numer

  try {
    await pointsService.createWeek(weekName);

    // Wysyłamy potwierdzenie
    await interaction.reply({
      content: `🟢 Created new week: **${weekName}** for category **${category}** (placeholder)`,
      ephemeral: true
    });

    // Odświeżamy panel kategorii, żeby pokazać nowe tygodnie
    switch (category) {
      case "donations":
        await pointsDonations.handlePointsDonations(interaction);
        break;

      case "duel":
        await pointsDuel.handlePointsDuel(interaction);
        break;

      default:
        await interaction.followUp({
          content: `⚠️ Unknown category: ${category}`,
          ephemeral: true
        });
        break;
    }
  } catch (error) {
    console.error("Create Week error:", error);
    await interaction.reply({
      content: "❌ Failed to create week (placeholder).",
      ephemeral: true
    });
  }
}