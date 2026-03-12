// src/pointsPanel/pointsButtons/pointsCreate.ts
import { ButtonInteraction, ModalSubmitInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

// -----------------------------
// Tworzenie nowego tygodnia (przycisk)
// -----------------------------
export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  const category = interaction.customId.replace("points_create_week_", "");

  // Prosty generator nowego tygodnia placeholder (Week 01, Week 02...)
  const allWeeks = await pointsService.getAllWeeks();
  const nextWeekNumber = allWeeks.length + 1;
  const weekName = `Week ${String(nextWeekNumber).padStart(2, "0")}`;

  try {
    // Tworzymy tydzień w arkuszu (placeholder)
    await pointsService.createWeek(weekName);

    // Potwierdzenie
    await interaction.reply({
      content: `🟢 Created new week: **${weekName}** for category **${category}**`,
      ephemeral: true
    });

    // Odświeżamy panel kategorii, aby pokazać nowy tydzień
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

// -----------------------------
// Placeholder dla modal submit (jeśli kiedyś użyjemy formy)
// -----------------------------
export async function handleCreateWeekSubmit(interaction: ModalSubmitInteraction<CacheType>) {
  await interaction.reply({
    content: "🟢 Create Week Submit – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}