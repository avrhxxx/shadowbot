// src/pointsPanel/pointsButtons/pointsListWeeks.ts
import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

/**
 * Placeholder: Wyświetla listę wszystkich stworzonych tygodni
 */
export async function handleListWeeks(interaction: ButtonInteraction<CacheType>): Promise<void> {
  try {
    // Pobieramy wszystkie tygodnie (placeholder może zwrócić puste lub przykładowe dane)
    const weeks: string[] = await pointsService.getAllWeeks();

    // Jeśli brak tygodni, placeholderowa odpowiedź
    if (!weeks.length) {
      await interaction.reply({
        content: "⚠️ No weeks created yet (placeholder).",
        ephemeral: true
      });
      return;
    }

    // Tworzymy listę tygodni do wiadomości
    const weekList = weeks.map((week: string, index: number) => `${index + 1}. ${week}`).join("\n");

    await interaction.reply({
      content: `📋 **Created Weeks (placeholder):**\n${weekList}`,
      ephemeral: true
    });

  } catch (error) {
    console.error("List weeks placeholder error:", error);
    await interaction.reply({
      content: "❌ Failed to fetch weeks (placeholder).",
      ephemeral: true
    });
  }
}