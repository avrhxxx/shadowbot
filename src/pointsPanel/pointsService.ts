// src/pointsPanel/pointsService.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { readSheet, writeSheet } from "../googleSheetsStorage";

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

// Typ wiersza w arkuszu Google Sheets (A-E kolumny)
type PointsRow = [string, string, string, string, string];

// ----------------------------
// HELPERS
// ----------------------------
function normalizePointsRows(rows: any[][]): PointsRow[] {
  return rows.map(r => [
    r[0] ?? "",
    r[1] ?? "",
    r[2] ?? "",
    r[3] ?? "",
    r[4] ?? ""
  ] as PointsRow);
}

// ----------------------------
// WEEKS
// ----------------------------
export async function createWeek(weekName: string): Promise<void> {
  const rawRows: any[][] = await readSheet("points");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const exists = rows.some(r => r[3] === weekName);
  if (exists) return;

  // dodajemy w każdej kategorii jako placeholder
  const newRow: PointsRow = ["Donations", "", "", weekName, ""];
  const newRow2: PointsRow = ["Duel", "", "", weekName, ""];
  await writeSheet("points", [...rows, newRow, newRow2]);
}

export async function getAllWeeks(): Promise<string[]> {
  const rawRows: any[][] = await readSheet("points");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

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
  const rawRows: any[][] = await readSheet("points");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const rowIndex = rows.findIndex(r =>
    r[0] === entry.category &&
    r[1] === entry.nick &&
    r[3] === entry.week
  );

  if (rowIndex !== -1) {
    rows[rowIndex][2] = entry.points;
  } else {
    const newRow: PointsRow = [
      entry.category,
      entry.nick,
      entry.points,
      entry.week,
      ""
    ];
    rows.push(newRow);
  }

  await writeSheet("points", rows);
}

// ----------------------------
// GET POINTS
// ----------------------------
export async function getPoints(category: PointsCategory, week?: string): Promise<PointsEntry[]> {
  const rawRows: any[][] = await readSheet("points");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

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
  const rawRows: any[][] = await readSheet("points");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const week1Rows = rows.filter(r => r[0] === category && r[3] === week1);
  const week2Rows = rows.filter(r => r[0] === category && r[3] === week2);

  const week2Map = new Map<string, string>();
  week2Rows.forEach(r => week2Map.set(r[1], r[2]));

  return week1Rows.map(r => ({
    nick: r[1],
    week1Points: r[2],
    week2Points: week2Map.get(r[1]) || "0"
  }));
}

// ----------------------------
// HANDLERY BUTTONÓW (ephemeral placeholders)
// ----------------------------
export async function handleAddPoints(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "🟢 Add Points functionality placeholder – to be implemented.",
    ephemeral: true
  });
}

export async function handleRemovePoints(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "🔴 Remove Points functionality placeholder – to be implemented.",
    ephemeral: true
  });
}

export async function handlePointsList(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "📋 Points List functionality placeholder – to be implemented.",
    ephemeral: true
  });
}

export async function handleCompareWeeks(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<void> {
  await interaction.reply({
    content: "📊 Compare Points functionality placeholder – to be implemented.",
    ephemeral: true
  });
}