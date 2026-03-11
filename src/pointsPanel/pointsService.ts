// src/pointsPanel/pointsService.ts
import { Interaction } from "discord.js";
import { savePoints, getPointsList } from "../googleSheetsStorage"; // <- funkcje do Sheets

// --- Guide i Settings ---
export async function handleGuide(interaction: Interaction) {
  await interaction.reply({
    content:
      "📖 **Points Panel Guide**\n" +
      "- Use the buttons to add points, view lists or compare weeks.\n" +
      "- Manual input or list input supported.\n" +
      "- Donations: numbers like 10, 100, 1,000...\n" +
      "- Duel: numbers in K/M format like 100.00K, 24.07M.",
    ephemeral: true
  });
}

export async function handleSettings(interaction: Interaction) {
  await interaction.reply({
    content: "⚙️ **Points Panel Settings**\n- Settings will be implemented here.",
    ephemeral: true
  });
}

// --- Dodawanie punktów ---
export async function handleAddPoints(interaction: Interaction) {
  await interaction.reply({
    content: "➕ Add Points clicked (manual input or list input implementation pending)",
    ephemeral: true
  });
  // Tutaj w przyszłości można otworzyć modal lub formularz, w którym wpisuje się Nick + Points + Kategoria + Week
}

// --- Wyświetlanie listy punktów ---
export async function handlePointsList(interaction: Interaction) {
  const pointsList = await getPointsList(); // pobiera wszystkie wpisy z Google Sheets
  let content = "📋 **Points List**\n";
  if (!pointsList || pointsList.length === 0) content += "No points yet.";
  else {
    pointsList.forEach((p, idx) => {
      content += `${idx + 1}. ${p.player} - ${p.points} (${p.category})\n`;
    });
  }

  await interaction.reply({ content, ephemeral: true });
}

// --- Porównanie tygodni ---
export async function handleCompareWeeks(interaction: Interaction) {
  await interaction.reply({
    content: "🔍 Compare Weeks clicked (to implement comparison logic)",
    ephemeral: true
  });
}

// --- Powrót do wyboru kategorii ---
export async function handleBackToCategories(interaction: Interaction) {
  await interaction.reply({
    content: "↩️ Back to Points Categories",
    ephemeral: true
  });
}

// --- Funkcje helper do Google Sheets (przykład) ---
export async function savePointEntry(category: string, player: string, points: string, week?: string) {
  await savePoints({ category, player, points, week });
}

export async function fetchPointsEntries() {
  return await getPointsList();
}