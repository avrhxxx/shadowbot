// src/pointsPanel/pointsService.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

/**
 * Tworzy nowy tydzień w systemie punktów
 * @param weekName Nazwa tygodnia, np. "01-03 - 07-03"
 */
export async function createWeek(weekName: string): Promise<void> {
  // TODO: integracja z Google Sheets
  console.log("Creating new week:", weekName);
}

/**
 * Pobiera listę wszystkich tygodni w systemie punktów
 * @returns Tablica nazw tygodni
 */
export async function getAllWeeks(): Promise<string[]> {
  // TODO: później pobieranie z Google Sheets
  return [
    "01-03 - 07-03",
    "08-03 - 14-03",
    "15-03 - 21-03"
  ];
}

/**
 * Dodaje punkty dla gracza w określonej kategorii i tygodniu
 * Placeholder do późniejszej implementacji
 */
export async function handleAddPoints(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "Add Points functionality coming soon.",
    ephemeral: true
  });
}

/**
 * Pokazuje listę punktów dla kategorii/tygodnia
 * Placeholder do późniejszej implementacji
 */
export async function handlePointsList(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "Points List functionality coming soon.",
    ephemeral: true
  });
}

/**
 * Porównuje tygodnie w ramach jednej kategorii
 * Placeholder do późniejszej implementacji
 */
export async function handleCompareWeeks(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "Compare Weeks functionality coming soon.",
    ephemeral: true
  });
}