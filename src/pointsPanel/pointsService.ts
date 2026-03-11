// src/pointsPanel/pointsService.ts

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
 * Placeholder: Dodaje punkty dla gracza w określonej kategorii i tygodniu
 */
export async function handleAddPoints(interaction: any): Promise<void> {
  await interaction.reply({
    content: "Add Points functionality coming soon.",
    ephemeral: true
  });
}

/**
 * Placeholder: Pokazuje listę punktów dla kategorii/tygodnia
 */
export async function handlePointsList(interaction: any): Promise<void> {
  await interaction.reply({
    content: "Points List functionality coming soon.",
    ephemeral: true
  });
}

/**
 * Placeholder: Porównuje tygodnie w ramach jednej kategorii
 */
export async function handleCompareWeeks(interaction: any): Promise<void> {
  await interaction.reply({
    content: "Compare Weeks functionality coming soon.",
    ephemeral: true
  });
}