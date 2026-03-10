// src/absencePanel/absenceService.ts
import { TextChannel } from "discord.js";
import * as GS from "../googleSheetsStorage";

export interface AbsenceObject {
  id: string;
  guildId: string;
  player: string;
  startDate: string; // ISO string np. "2026-03-12"
  endDate: string;
  createdAt: number;
  notified: boolean;
}

export interface AbsenceConfig {
  notificationChannel?: string;
  [key: string]: any;
}

// -----------------------------
// HELPERS
// -----------------------------
function safeJSONParse<T>(value: any, fallback: T): T {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function toNumber(value: any, fallback = 0) { return value != null ? Number(value) : fallback; }
function toBool(value: any) { return value === true || value === "true"; }

// -----------------------------
// LOAD ABSENCES
// -----------------------------
export async function loadAbsences(guildId: string): Promise<AbsenceObject[]> {
  const rows: any[][] = await GS.readSheet("absence");
  if (!rows.length) return [];
  const headers: string[] = rows[0] as string[];

  return rows.slice(1)
    .map((row: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, i: number) => obj[h] = row[i] ?? null);
      return {
        id: obj.id,
        guildId: obj.guildId,
        player: obj.player,
        startDate: obj.startDate,
        endDate: obj.endDate,
        createdAt: toNumber(obj.createdAt),
        notified: toBool(obj.notified)
      } as AbsenceObject;
    })
    .filter(a => a.guildId === guildId);
}

export async function getAbsences(guildId: string): Promise<AbsenceObject[]> {
  return loadAbsences(guildId);
}

export async function getAbsenceByPlayer(guildId: string, player: string): Promise<AbsenceObject | null> {
  const absences = await loadAbsences(guildId);
  return absences.find(a => a.player === player) || null;
}

// -----------------------------
// UPDATE / DELETE CELLS
// -----------------------------
export async function updateAbsenceCell(absenceId: string, columnName: string, value: any) {
  const rows: any[][] = await GS.readSheet("absence");
  if (!rows.length) return;

  const headers: string[] = rows[0] as string[];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) throw new Error(`Column ${columnName} not found`);

  const rowIndex = rows.findIndex((r: any[]) => r[0] === absenceId);
  if (rowIndex === -1) throw new Error(`Absence ID ${absenceId} not found`);

  await GS.updateEventCell(rowIndex + 1, colIndex + 1, value);
}

export async function deleteAbsenceRow(absenceId: string) {
  const rows: any[][] = await GS.readSheet("absence");
  if (!rows.length) return;

  const rowIndex = rows.findIndex((r: any[]) => r[0] === absenceId);
  if (rowIndex === -1) return;

  await GS.deleteEventRow(rowIndex + 1);
}

// -----------------------------
// CREATE / SAVE ABSENCE
// -----------------------------
export async function createAbsence(data: AbsenceObject): Promise<AbsenceObject> {
  const rows: any[][] = await GS.readSheet("absence");
  const headers: string[] = rows[0] ?? ["id","guildId","player","startDate","endDate","createdAt","notified"];

  if (!headers.includes("notified")) headers.push("notified");

  const newRow = headers.map(h => {
    if (h === "notified") return data.notified ? "true" : "false";
    if (h === "createdAt") return data.createdAt ?? Date.now();
    return (data as any)[h] ?? "";
  });

  await GS.writeSheet("absence", [headers, ...rows.slice(1), newRow]);
  return data;
}

export async function saveAbsences(guildId: string, absences: AbsenceObject[]) {
  for (const absence of absences) {
    await updateAbsenceCell(absence.id, "player", absence.player);
    await updateAbsenceCell(absence.id, "startDate", absence.startDate);
    await updateAbsenceCell(absence.id, "endDate", absence.endDate);
    await updateAbsenceCell(absence.id, "notified", absence.notified ? "true" : "false");
    await updateAbsenceCell(absence.id, "createdAt", absence.createdAt);
  }
}

// -----------------------------
// CONFIG SHEET HELPERS
// -----------------------------
export async function getAbsenceConfig(guildId: string): Promise<AbsenceConfig> {
  const rows: any[][] = await GS.readSheet("absence_config");
  if (!rows.length) return {};
  const headers: string[] = rows[0];
  const dataRows = rows.slice(1);

  const guildIndex = headers.indexOf("guildId");
  if (guildIndex === -1) return {};

  const row = dataRows.find(r => r[guildIndex] === guildId);
  if (!row) return {};

  const config: AbsenceConfig = {};
  headers.forEach((h: string, i: number) => config[h] = row[i] ?? null);
  return config;
}

export async function setAbsenceNotificationChannel(guildId: string, channelId: string) {
  const rows: any[][] = await GS.readSheet("absence_config");
  const headers: string[] = rows[0] ?? ["guildId","notificationChannel"];
  const dataRows = rows.slice(1);

  if (!headers.includes("notificationChannel")) headers.push("notificationChannel");
  const guildIndex = headers.indexOf("guildId");
  const colIndex = headers.indexOf("notificationChannel");

  let row = dataRows.find(r => r[guildIndex] === guildId);
  if (!row) {
    row = new Array(headers.length).fill("");
    row[guildIndex] = guildId;
    dataRows.push(row);
  }

  await GS.writeSheet("absence_config", [headers, ...dataRows]);
  await GS.updateConfigCell(dataRows.indexOf(row) + 1, colIndex + 1, channelId);
}