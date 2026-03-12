// src/pointsPanel/pointsService.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import * as GS from "../googleSheetsStorage";

// ----------------------------
// TYPES
// ----------------------------
export type PointsCategory = "Donations" | "Duel";

export interface PointsEntry {
  category: PointsCategory;
  nick: string;
  points: string; // np. "100", "24.07M"
  week: string;   // np. "01-03 - 07-03"
}

// ----------------------------
// WEEKS
// ----------------------------
export async function createWeek(weekName: string): Promise<void> {
  const rows = await GS.readSheet("points");
  // sprawdzamy, czy tydzień już istnieje w jakiejkolwiek kategorii
  const exists = rows.some(r => r[3] === weekName);
  if (exists) return;

  // dodajemy w każdej kategorii jako placeholder (można później zostawić puste)
  const newRow: any[] = ["Donations", "", "", weekName, ""]; // A-E
  const newRow2: any[] = ["Duel", "", "", weekName, ""];    // A-E
  await GS.writeSheet("points", [...rows, newRow, newRow2]);
}

export async function getAllWeeks(): Promise<string[]> {
  const rows = await GS.readSheet("points");
  const weeksSet = new Set<string>();
  rows.forEach(r => {
    if (r[3]) weeksSet.add(r[3]);
  });
  return Array.from(weeksSet);
}

// ----------------------------
// ADD POINTS
// ----------------------------
export async function addPoints(entry: PointsEntry): Promise<void> {
  const rows = await GS.readSheet("points");

  // Szukamy wiersza w tej kategorii i tygodniu z tym nickiem
  const rowIndex = rows.findIndex(r =>
    r[0] === entry.category &&
    r[1] === entry.nick &&
    r[3] === entry.week
  );

  if (rowIndex !== -1) {
    // aktualizacja istniejącego wiersza
    rows[rowIndex][2] = entry.points;
  } else {
    // nowy wiersz
    const newRow = [
      entry.category,
      entry.nick,
      entry.points,
      entry.week,
      "" // separator
    ];
    rows.push(newRow);
  }

  await GS.writeSheet("points", rows);
}

// ----------------------------
// GET POINTS
// ----------------------------
export async function getPoints(category: PointsCategory, week?: string): Promise<PointsEntry[]> {
  const rows = await GS.readSheet("points");

  return rows
    .filter(r => r[0] === category && (!week || r[3] === week))
    .map(r => ({
      category: r[0] as PointsCategory,
      nick: r[1],
      points: r[2],
      week: r[3]
    }));
}

// ----------------------------
// COMPARE WEEKS
// ----------------------------
export async function compareWeeks(category: PointsCategory, week1: string, week2: string) {
  const rows = await GS.readSheet("points");

  const week1Rows = rows.filter(r => r[0] === category && r[3] === week1);
  const week2Rows = rows.filter(r => r[0] === category && r[3] === week2);

  // Mapujemy według nicka
  const week2Map = new Map<string, string>();
  week2Rows.forEach(r => week2Map.set(r[1], r[2]));

  return week1Rows.map(r => ({
    nick: r[1],
    week1Points: r[2],
    week2Points: week2Map.get(r[1]) || "0"
  }));
}

// ----------------------------
// HANDLERY BUTTONÓW (ephemeral placeholder)
// ----------------------------
export async function handleAddPoints(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "Add Points functionality coming soon.",
    ephemeral: true
  });
}

export async function handlePointsList(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "Points List functionality coming soon.",
    ephemeral: true
  });
}

export async function handleCompareWeeks(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "Compare Weeks functionality coming soon.",
    ephemeral: true
  });
}