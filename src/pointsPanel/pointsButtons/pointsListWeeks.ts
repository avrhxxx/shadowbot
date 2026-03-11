// src/pointsPanel/pointsButtons/pointsListWeeks.ts
import { ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

/**
 * Wyświetla listę wszystkich stworzonych tygodni
 */
export async function handleListWeeks(i: ButtonInteraction<CacheType>) {
  try {
    // Pobieramy wszystkie tygodnie z serwisu
    const weeks = await pointsService.getAllWeeks();

    if (!weeks || weeks.length === 0) {
      return await i.reply({
        content: "⚠️ No weeks created yet.",
        ephemeral: true
      });
    }

    // Formatujemy listę do czytelnej wiadomości
    const weekList = weeks.map((w, idx) => `${idx + 1}. ${w}`).join("\n");

    await i.reply({
      content: `📋 **Created Weeks:**\n${weekList}`,
      ephemeral: true
    });

  } catch (error) {
    console.error("List weeks error:", error);
    await i.reply({
      content: "❌ Failed to fetch weeks.",
      ephemeral: true
    });
  }
}