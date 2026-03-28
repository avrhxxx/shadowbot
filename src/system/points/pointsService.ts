// =====================================
// 📁 src/system/points/pointsService.ts
// =====================================

import { SheetRepository } from "../google/SheetRepository";
import crypto from "crypto";
import { logger } from "../../core/logger/log";

// ----------------------------
// TYPES
// ----------------------------
export type PointsCategory = "Donations" | "Duel";

export interface PointsEntry {
  id: string;
  guildId: string;
  category: PointsCategory;
  nick: string;
  points: number;
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
  guildId: string,
  category: PointsCategory,
  week: string
): Promise<void> {
  const existing = await weeksRepo.findAll({ guildId, category, week });

  if (existing.length > 0) return;

  await weeksRepo.create({
    id: crypto.randomUUID(),
    guildId,
    category,
    week,
    nick: "",
    points: 0,
  });

  logger.emit({
    scope: "points.service",
    event: "week_created",
    context: { guildId, category, week },
  });
}

export async function getAllWeeks(
  guildId: string,
  category?: PointsCategory
): Promise<string[]> {
  const rows = await weeksRepo.findAll({ guildId });

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
    guildId: entry.guildId,
    week: entry.week,
    nick: entry.nick,
  });

  if (existing.length > 0) {
    await repo.updateById(existing[0].id, {
      points: entry.points,
    });

    logger.emit({
      scope: "points.service",
      event: "points_updated",
      context: entry,
    });

  } else {
    await repo.create({
      ...entry,
      id: entry.id ?? crypto.randomUUID(),
    });

    logger.emit({
      scope: "points.service",
      event: "points_created",
      context: entry,
    });
  }
}

// ----------------------------
// 📋 GET
// ----------------------------
export async function getPoints(
  guildId: string,
  category: PointsCategory,
  week?: string
): Promise<PointsEntry[]> {
  const repo = getRepo(category);

  const rows = await repo.findAll({ guildId });

  return rows.filter((r) => !week || r.week === week);
}

// ----------------------------
// 📊 COMPARE
// ----------------------------
export async function compareWeeks(
  guildId: string,
  category: PointsCategory,
  week1: string,
  week2: string
) {
  const repo = getRepo(category);

  const all = await repo.findAll({ guildId });

  const w1 = all.filter((r) => r.week === week1);
  const w2 = all.filter((r) => r.week === week2);

  const map2 = new Map<string, number>();
  w2.forEach((r) => map2.set(r.nick, r.points));

  return w1.map((r) => ({
    nick: r.nick,
    week1Points: r.points,
    week2Points: map2.get(r.nick) || 0,
  }));
}