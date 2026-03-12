// src/pointsPanel/pointsButtons/pointsSelectWeek.ts
import { PointsCategory, getAllWeeks } from "../pointsService";

// -----------------------------
// Funkcja pobierająca tygodnie dla danej kategorii
// -----------------------------
export async function getWeeksByCategory(categoryId: string): Promise<string[]> {
  const allWeeks = await getAllWeeks();

  // Filtrujemy tygodnie po kategorii
  // Zakładamy, że nazwa tygodnia w Google Sheets jest unikalna i przypisana do danej kategorii
  // Możemy później rozbudować logikę, jeśli będziemy potrzebować dokładnego filtrowania
  return allWeeks.filter(week => week.includes(categoryId)); // tymczasowy filter, można dopracować
}

// -----------------------------
// Handler kliknięcia tygodnia (opcjonalny, jeśli chcemy dynamicznie podpiąć przyciski Add/Remove/Compare/List)
// -----------------------------
export async function handleSelectWeek(interaction: any, categoryId: string) {
  const weeks = await getWeeksByCategory(categoryId);

  // na razie wyślemy prostą listę tygodni
  await interaction.reply({
    content: `📌 **Weeks for ${categoryId}**:\n${weeks.join("\n") || "No weeks yet."}`,
    ephemeral: true
  });
}