// src/pointsPanel/pointsService.ts
import { ButtonInteraction, CacheType } from "discord.js";

/**
 * Tworzy nowy tydzień w systemie punktów
 */
export async function createWeek(weekName: string) {
  // TU później będzie zapis do Google Sheets
  console.log("Creating new week:", weekName);
}

/**
 * Dodaje punkty do gracza w danej kategorii i tygodniu
 */
export async function handleAddPoints(i: ButtonInteraction<CacheType>) {
  // Placeholder
  console.log("Add points clicked", i.customId);
  await i.reply({ content: "✅ Add Points clicked (not implemented yet)", ephemeral: true });
}

/**
 * Pokazuje listę punktów graczy w kategorii/tygodniu
 */
export async function handlePointsList(i: ButtonInteraction<CacheType>) {
  // Placeholder
  console.log("Points List clicked", i.customId);
  await i.reply({ content: "📄 Points List clicked (not implemented yet)", ephemeral: true });
}

/**
 * Porównuje tygodnie w danej kategorii
 */
export async function handleCompareWeeks(i: ButtonInteraction<CacheType>) {
  // Placeholder
  console.log("Compare Weeks clicked", i.customId);
  await i.reply({ content: "🔍 Compare Weeks clicked (not implemented yet)", ephemeral: true });
}