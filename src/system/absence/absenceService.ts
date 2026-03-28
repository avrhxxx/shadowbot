// =====================================
// 📁 src/system/absence/absenceService.ts
// =====================================

import { SheetRepository } from "../google/SheetRepository";
import crypto from "crypto";
import { logger } from "../../core/logger/log";

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
  id?: string;
  guildId: string;
  notificationChannel?: string;
  absenceEmbedId?: string;
  [key: string]: any;
}

// =============================
// 📦 REPOS
// =============================
const absenceRepo = new SheetRepository<AbsenceObject>("absence");
const configRepo = new SheetRepository<AbsenceConfig>("absence_config");

// =============================
// 📥 LOAD
// =============================
export async function getAbsences(
  guildId: string
): Promise<AbsenceObject[]> {
  return absenceRepo.findAll({ guildId });
}

export async function getAbsenceByPlayer(
  guildId: string,
  player: string
): Promise<AbsenceObject | null> {
  const absences = await getAbsences(guildId);

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
    logger.emit({
      scope: "absence.service",
      event: "create_duplicate",
      level: "warn",
      context: {
        guildId: data.guildId,
        player: data.player,
      },
    });

    throw new Error(
      `Player ${data.player} is already on absence list.`
    );
  }

  const newAbsence: AbsenceObject = {
    ...data,
    id: data.id ?? crypto.randomUUID(),
    year: data.year ?? new Date().getFullYear(),
    createdAt: data.createdAt ?? Date.now(),
  };

  await absenceRepo.create(newAbsence);

  logger.emit({
    scope: "absence.service",
    event: "created",
    context: {
      guildId: data.guildId,
      player: data.player,
      absenceId: newAbsence.id,
    },
  });

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

  if (!target) {
    logger.emit({
      scope: "absence.service",
      event: "remove_not_found",
      level: "warn",
      context: { guildId, player },
    });

    return null;
  }

  await absenceRepo.deleteById(target.id);

  logger.emit({
    scope: "absence.service",
    event: "removed",
    context: {
      guildId,
      player,
      absenceId: target.id,
    },
  });

  return target;
}

// =============================
// ⚙️ CONFIG
// =============================
export async function getAbsenceConfig(
  guildId: string
): Promise<AbsenceConfig> {
  const rows = await configRepo.findAll({ guildId });

  return rows[0] || { guildId };
}

export async function setNotificationChannel(
  guildId: string,
  channelId: string
) {
  await setConfig(guildId, "notificationChannel", channelId);

  logger.emit({
    scope: "absence.service",
    event: "set_notification_channel",
    context: { guildId, channelId },
  });
}

export async function setAbsenceEmbedId(
  guildId: string,
  messageId: string
) {
  await setConfig(guildId, "absenceEmbedId", messageId);

  logger.emit({
    scope: "absence.service",
    event: "set_embed_id",
    context: { guildId, messageId },
  });
}

export async function setConfig(
  guildId: string,
  key: string,
  value: any
) {
  const existing = await configRepo.findAll({ guildId });

  if (!existing.length) {
    await configRepo.create({
      id: crypto.randomUUID(),
      guildId,
      [key]: value,
    });

    logger.emit({
      scope: "absence.service",
      event: "config_created",
      context: { guildId, key },
    });

    return;
  }

  await configRepo.updateById(existing[0].id!, {
    [key]: value,
  });

  logger.emit({
    scope: "absence.service",
    event: "config_updated",
    context: { guildId, key },
  });
}