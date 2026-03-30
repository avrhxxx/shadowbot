// =====================================
// 📁 src/system/absence/absenceService.ts
// =====================================

/**
 * 📁 File: src/system/absence/absenceService.ts
 * 🧠 Role: domain service
 *
 * 📄 Description:
 * Business logic for absence system.
 *
 * 📥 Input:
 * - guildId, player, absence data
 * - ctx (REQUIRED)
 *
 * 📤 Output:
 * - absence objects / config
 *
 * 🔗 Dependencies:
 * - SheetRepository
 * - core/logger
 * - core/trace
 *
 * 📡 Used by:
 * - absenceHandler
 *
 * 🆔 Flow:
 * - traceId: REQUIRED
 *
 * 📊 Logging:
 * - logger: YES (ctx)
 *
 * ⚠️ Notes:
 * - STRICT CORE COMPLIANCE
 * - ctx is REQUIRED everywhere
 */

import { SheetRepository } from "@/integrations/google/SheetRepository";
import { log } from "@/core/logger/log";
import { TraceContext } from "@/core/trace/TraceContext";

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
  [key: string]: unknown;
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
  guildId: string,
  ctx: TraceContext
): Promise<AbsenceObject[]> {
  const l = log.ctx(ctx);

  l.event("absence.get_all", {
    context: { guildId },
  });

  return absenceRepo.findAll({ guildId });
}

export async function getAbsenceByPlayer(
  guildId: string,
  player: string,
  ctx: TraceContext
): Promise<AbsenceObject | null> {
  const l = log.ctx(ctx);

  const absences = await getAbsences(guildId, ctx);

  const found =
    absences.find(
      (a) => a.player.toLowerCase() === player.toLowerCase()
    ) || null;

  l.event("absence.get_by_player", {
    context: { guildId, player, found: !!found },
  });

  return found;
}

// =============================
// ➕ CREATE
// =============================
export async function createAbsence(
  data: AbsenceObject,
  ctx: TraceContext
): Promise<AbsenceObject> {
  const l = log.ctx(ctx);

  const existing = await getAbsenceByPlayer(
    data.guildId,
    data.player,
    ctx
  );

  if (existing) {
    l.warn("absence.create.duplicate", {
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

  l.event("absence.created", {
    result: {
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
  player: string,
  ctx: TraceContext
): Promise<AbsenceObject | null> {
  const l = log.ctx(ctx);

  const absences = await getAbsences(guildId, ctx);

  const target = absences.find(
    (a) => a.player.toLowerCase() === player.toLowerCase()
  );

  if (!target) {
    l.warn("absence.remove.not_found", {
      context: { guildId, player },
    });
    return null;
  }

  await absenceRepo.deleteById(target.id);

  l.event("absence.removed", {
    result: {
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
  guildId: string,
  ctx: TraceContext
): Promise<AbsenceConfig> {
  const l = log.ctx(ctx);

  const rows = await configRepo.findAll({ guildId });

  l.event("absence.config.get", {
    context: { guildId, found: rows.length > 0 },
  });

  return rows[0] || { guildId };
}

export async function setNotificationChannel(
  guildId: string,
  channelId: string,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  await setConfig(guildId, "notificationChannel", channelId, ctx);

  l.event("absence.config.notification_channel.set", {
    context: { guildId, channelId },
  });
}

export async function setAbsenceEmbedId(
  guildId: string,
  messageId: string,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  await setConfig(guildId, "absenceEmbedId", messageId, ctx);

  l.event("absence.config.embed_id.set", {
    context: { guildId, messageId },
  });
}

export async function setConfig(
  guildId: string,
  key: string,
  value: unknown,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  const existing = await configRepo.findAll({ guildId });

  if (!existing.length) {
    await configRepo.create({
      id: crypto.randomUUID(),
      guildId,
      [key]: value,
    });

    l.event("absence.config.created", {
      context: { guildId, key },
    });

    return;
  }

  await configRepo.updateById(existing[0].id!, {
    [key]: value,
  });

  l.event("absence.config.updated", {
    context: { guildId, key },
  });
}