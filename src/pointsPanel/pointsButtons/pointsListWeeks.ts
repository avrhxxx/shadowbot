// src/pointsPanel/pointsButtons/pointsListWeeks.ts
import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

/**
 * Wyświetla listę wszystkich stworzonych tygodni
 */
export async function handleListWeeks(interaction: ButtonInteraction<CacheType>): Promise<void> {
  try {
    // Pobieramy wszystkie tygodnie z serwisu
    const weeks: string[] = await pointsService.getAllWeeks();

    if (!weeks.length) {
      await interaction.reply({
        content: "⚠️ No weeks created yet.",
        ephemeral: true
      });
      return;
    }

    // Formatujemy listę do czytelnej wiadomości
    const weekList = weeks.map((week: string, index: number) => `${index + 1}. ${week}`).join("\n");

    await interaction.reply({
      content: `📋 **Created Weeks:**\n${weekList}`,
      ephemeral: true
    });

  } catch (error) {
    console.error("List weeks error:", error);
    await interaction.reply({
      content: "❌ Failed to fetch weeks.",
      ephemeral: true
    });
  }
}