// src/pointsPanel/pointsService.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { readSheet, writeSheet, updateCell } from "../google/googleSheetsStorage";

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

// Typ wiersza w arkuszu Google Sheets (A-D kolumny)
type PointsRow = [string, string, string, string];

// ----------------------------
// HELPERS
// ----------------------------
function normalizePointsRows(rows: any[][]): PointsRow[] {
  return rows.map((r: any[]) => [
    r[0] ?? "",
    r[1] ?? "",
    r[2] ?? "",
    r[3] ?? ""
  ] as PointsRow);
}

// ----------------------------
// WEEKS TAB
// ----------------------------
export async function createWeek(category: PointsCategory, weekName: string): Promise<void> {
  const rawRows: any[][] = await readSheet("points_weeks");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const exists = rows.some((r: PointsRow) => r[0] === category && r[1] === weekName);
  if (exists) return;

  const newRow: PointsRow = [category, weekName, "", ""];
  await writeSheet("points_weeks", [...rows, newRow]);
}

export async function getAllWeeks(category?: PointsCategory): Promise<string[]> {
  const rawRows: any[][] = await readSheet("points_weeks");
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const weeksSet = new Set<string>();
  rows.forEach((r: PointsRow) => {
    if (!category || r[0] === category) weeksSet.add(r[1]);
  });

  return Array.from(weeksSet);
}

// ----------------------------
// ADD / UPDATE POINTS
// ----------------------------
export async function addPoints(entry: PointsEntry): Promise<void> {
  const tab = entry.category === "Donations" ? "points_donations" : "points_duel";
  const rawRows: any[][] = await readSheet(tab);
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const rowIndex = rows.findIndex((r: PointsRow) => r[1] === entry.week && r[2] === entry.nick);

  if (rowIndex !== -1) {
    await updateCell(tab, rowIndex + 2, 4, entry.points);
  } else {
    const newRow: PointsRow = [entry.category, entry.week, entry.nick, entry.points];
    await writeSheet(tab, [...rows, newRow]);
  }
}

export async function getPoints(category: PointsCategory, week?: string): Promise<PointsEntry[]> {
  const tab = category === "Donations" ? "points_donations" : "points_duel";
  const rawRows: any[][] = await readSheet(tab);
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  return rows
    .filter((r: PointsRow) => (!week || r[1] === week))
    .map((r: PointsRow) => ({
      category: r[0] as PointsCategory,
      week: r[1],
      nick: r[2],
      points: r[3]
    }));
}

// ----------------------------
// COMPARE WEEKS
// ----------------------------
export async function compareWeeks(category: PointsCategory, week1: string, week2: string) {
  const tab = category === "Donations" ? "points_donations" : "points_duel";
  const rawRows: any[][] = await readSheet(tab);
  const rows: PointsRow[] = normalizePointsRows(rawRows);

  const week1Rows = rows.filter((r: PointsRow) => r[1] === week1);
  const week2Rows = rows.filter((r: PointsRow) => r[1] === week2);

  const week2Map = new Map<string, string>();
  week2Rows.forEach((r: PointsRow) => week2Map.set(r[2], r[3]));

  return week1Rows.map((r: PointsRow) => ({
    nick: r[2],
    week1Points: r[3],
    week2Points: week2Map.get(r[2]) || "0"
  }));
}

// ----------------------------
// HANDLERY BUTTONÓW
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