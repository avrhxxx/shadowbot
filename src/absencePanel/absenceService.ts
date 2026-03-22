// src/absencePanel/absenceService.ts

import { SheetRepository } from "../google/SheetRepository";

const absenceRepo = new SheetRepository<AbsenceObject>("absence");
const configRepo = new SheetRepository<any>("absence_config");

// =============================
// TYPES
// =============================
export interface AbsenceObject {
  id: string;
  guildId: string;
  player: string;
  startDate: string;
  endDate: string;
  createdAt: number;
  year: number;
}

export interface AbsenceConfig {
  notificationChannel?: string;
  absenceEmbedId?: string;
  [key: string]: any;
}

// =============================
// 📥 LOAD
// =============================
export async function getAbsences(guildId: string): Promise<AbsenceObject[]> {
  return absenceRepo.findAll({ guildId });
}

export async function getAbsenceByPlayer(
  guildId: string,
  player: string
): Promise<AbsenceObject | null> {
  const absences = await absenceRepo.findAll({ guildId });

  return (
    absences.find(
      (a) => a.player.toLowerCase() === player.toLowerCase()
    ) || null
  );
}

// =============================
// ➕ CREATE
// =============================
export async function createAbsence(
  data: AbsenceObject
): Promise<AbsenceObject> {
  const existing = await getAbsenceByPlayer(
    data.guildId,
    data.player
  );

  if (existing) {
    throw new Error(
      `Player ${data.player} is already on absence list.`
    );
  }

  const newAbsence: AbsenceObject = {
    ...data,
    year: data.year ?? new Date().getFullYear(),
    createdAt: data.createdAt ?? Date.now(),
  };

  await absenceRepo.create(newAbsence);

  return newAbsence;
}

// =============================
// ❌ DELETE
// =============================
export async function removeAbsence(
  guildId: string,
  player: string
): Promise<AbsenceObject | null> {
  const absences = await getAbsences(guildId);

  const target = absences.find(
    (a) => a.player.toLowerCase() === player.toLowerCase()
  );

  if (!target) return null;

  await absenceRepo.deleteById(target.id);

  return target;
}

// =============================
// ⚙️ CONFIG
// =============================
export async function getAbsenceConfig(
  guildId: string
): Promise<AbsenceConfig> {
  const rows = await configRepo.findAll({ guildId });
  return rows[0] || {};
}

export async function setNotificationChannel(
  guildId: string,
  channelId: string
) {
  await setConfig(guildId, "notificationChannel", channelId);
}

export async function setAbsenceEmbedId(
  guildId: string,
  messageId: string
) {
  await setConfig(guildId, "absenceEmbedId", messageId);
}

export async function setConfig(
  guildId: string,
  key: string,
  value: any
) {
  const existing = await configRepo.findAll({ guildId });

  if (!existing.length) {
    await configRepo.create({
      guildId,
      [key]: value,
    });
    return;
  }

  await configRepo.updateById(existing[0].id, {
    [key]: value,
  });
}