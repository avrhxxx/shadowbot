// src/pointsPanel/pointsService.ts

// 🔥 [IMPORT OK]
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { SheetRepository } from "../google/SheetRepository";
import crypto from "crypto"; // 🔥 [DODANE - ID SAFETY]

// ----------------------------
// TYPES
// ----------------------------
export type PointsCategory = "Donations" | "Duel";

export interface PointsEntry {
  id?: string;
  category: PointsCategory;
  nick: string;
  points: string;
  week: string;
}

// ----------------------------
// 📦 REPOS
// ----------------------------
const weeksRepo = new SheetRepository<PointsEntry>("points_weeks");
const donationsRepo = new SheetRepository<PointsEntry>("points_donations");
const duelRepo = new SheetRepository<PointsEntry>("points_duel");

function getRepo(category: PointsCategory) {
  return category === "Donations" ? donationsRepo : duelRepo;
}

// ----------------------------
// 📆 WEEKS
// ----------------------------
export async function createWeek(
  category: PointsCategory,
  week: string
): Promise<void> {
  const existing = await weeksRepo.findAll({ category, week });

  if (existing.length > 0) return;

  await weeksRepo.create({
    id: crypto.randomUUID(), // 🔥 [FIX - REQUIRED BY REPO]
    category,
    week,
    nick: "",
    points: "",
  });
}

export async function getAllWeeks(
  category?: PointsCategory
): Promise<string[]> {
  const rows = await weeksRepo.findAll();

  const filtered = category
    ? rows.filter((r) => r.category === category)
    : rows;

  return [...new Set(filtered.map((r) => r.week))];
}

// ----------------------------
// ➕ ADD / UPDATE
// ----------------------------
export async function addPoints(entry: PointsEntry): Promise<void> {
  const repo = getRepo(entry.category);

  const existing = await repo.findAll({
    week: entry.week,
    nick: entry.nick,
  });

  if (existing.length > 0) {
    await repo.updateById(existing[0].id!, {
      points: entry.points,
    });
  } else {
    await repo.create({
      ...entry,
      id: entry.id ?? crypto.randomUUID(), // 🔥 [CRITICAL FIX]
    });
  }
}

// ----------------------------
// 📋 GET
// ----------------------------
export async function getPoints(
  category: PointsCategory,
  week?: string
): Promise<PointsEntry[]> {
  const repo = getRepo(category);

  const rows = await repo.findAll();

  return rows.filter((r) => !week || r.week === week);
}

// ----------------------------
// 📊 COMPARE
// ----------------------------
export async function compareWeeks(
  category: PointsCategory,
  week1: string,
  week2: string
) {
  const repo = getRepo(category);

  const all = await repo.findAll();

  const w1 = all.filter((r) => r.week === week1);
  const w2 = all.filter((r) => r.week === week2);

  const map2 = new Map<string, string>();
  w2.forEach((r) => map2.set(r.nick, r.points));

  return w1.map((r) => ({
    nick: r.nick,
    week1Points: r.points,
    week2Points: map2.get(r.nick) || "0",
  }));
}

// ----------------------------
// 🎛 HANDLERY (placeholder)
// ----------------------------
export async function handleAddPoints(
  interaction: ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  await interaction.reply({
    content: "🟢 Add Points functionality placeholder – to be implemented.",
    ephemeral: true,
  });
}

export async function handleRemovePoints(
  interaction: ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  await interaction.reply({
    content: "🔴 Remove Points functionality placeholder – to be implemented.",
    ephemeral: true,
  });
}

export async function handlePointsList(
  interaction: ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  await interaction.reply({
    content: "📋 Points List functionality placeholder – to be implemented.",
    ephemeral: true,
  });
}

export async function handleCompareWeeks(
  interaction: ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  await interaction.reply({
    content: "📊 Compare Points functionality placeholder – to be implemented.",
    ephemeral: true,
  });
}