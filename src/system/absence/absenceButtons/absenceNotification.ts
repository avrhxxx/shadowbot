// =====================================
// 📁 src/system/absence/absenceButtons/absenceNotification.ts
// =====================================

import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "../absenceService";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// -----------------------------
// HELPERS
// -----------------------------
function formatAbsenceDate(dateStr: string, year: number): string {
  const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) return dateStr;

  const day = Number(match[1]).toString().padStart(2, "0");
  const month = Number(match[2]).toString().padStart(2, "0");

  return `${day}.${month}.${year}`;
}

function parseAbsenceDate(dateStr: string, year: number): Date | null {
  const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;

  return new Date(year, month, day);
}

// -----------------------------
// GET CHANNEL
// -----------------------------
export async function getNotificationChannel(guild: Guild): Promise<TextChannel | null> {
  const traceId = createTraceId();

  const config = await AS.getAbsenceConfig(guild.id);
  if (!config.notificationChannel) return null;

  try {
    const channel = await guild.channels.fetch(config.notificationChannel);
    if (!channel || !channel.isTextBased()) return null;

    return channel as TextChannel;
  } catch (err) {
    logger.emit({
      scope: "absence.notification",
      event: "fetch_channel_failed",
      traceId,
      level: "error",
      error: err,
    });
    return null;
  }
}

// -----------------------------
// EMBED UPDATE
// -----------------------------
export async function updateAbsenceEmbed(guild: Guild) {
  const traceId = createTraceId();

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  const absences = await AS.getAbsences(guild.id);
  const now = new Date();
  const unixNow = Math.floor(now.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle("📋 Absence List")
    .setColor("Blue");

  if (!absences.length) {
    embed.setDescription("No active absences.");
  } else {
    const byBackDate: Record<string, string[]> = {};

    absences.forEach(a => {
      const endDate = parseAbsenceDate(a.endDate, a.year ?? now.getFullYear());

      const backStr = endDate
        ? formatAbsenceDate(a.endDate, a.year ?? now.getFullYear())
        : "Unknown";

      const unixBack = endDate
        ? Math.floor(endDate.getTime() / 1000)
        : 0;

      if (!byBackDate[backStr]) byBackDate[backStr] = [];

      byBackDate[backStr].push(
        `• 👤 ${a.player} — returns <t:${unixBack}:R>`
      );
    });

    embed.setDescription(
      Object.keys(byBackDate)
        .sort((a, b) => {
          const da = a.split(".").reverse().join("");
          const db = b.split(".").reverse().join("");
          return Number(da) - Number(db);
        })
        .map(date =>
          `📅 Back on ${date}\n${byBackDate[date].join("\n")}`
        )
        .join("\n\n")
    );
  }

  embed.addFields({
    name: "Last Update",
    value: `<t:${unixNow}:F>`
  });

  try {
    const config = await AS.getAbsenceConfig(guild.id);
    let message;

    if (config.absenceEmbedId) {
      try {
        message = await channel.messages.fetch(config.absenceEmbedId);
        await message.edit({ embeds: [embed] });
      } catch {
        message = await channel.send({ embeds: [embed] });
        await AS.setAbsenceEmbedId(guild.id, message.id);
      }
    } else {
      message = await channel.send({ embeds: [embed] });
      await AS.setAbsenceEmbedId(guild.id, message.id);
    }

    if (!message.pinned)
      await message.pin().catch(() => {});

  } catch (err) {
    logger.emit({
      scope: "absence.notification",
      event: "update_embed_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

// -----------------------------
// NOTIFICATIONS
// -----------------------------
export async function notifyAbsenceAdded(
  guild: Guild,
  player: string,
  startDate: string,
  endDate: string
) {
  const traceId = createTraceId();

  const absences = await AS.getAbsences(guild.id);
  const absence = absences.find(a => a.player === player);
  const year = absence?.year ?? new Date().getFullYear();

  const end = parseAbsenceDate(endDate, year);
  const unixBack = end ? Math.floor(end.getTime() / 1000) : 0;

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  try {
    await channel.send(
      `📌 Player **${player}** is now absent from ${formatAbsenceDate(startDate, year)} to ${formatAbsenceDate(endDate, year)} (returns <t:${unixBack}:R>).`
    );

    await updateAbsenceEmbed(guild);

  } catch (err) {
    logger.emit({
      scope: "absence.notification",
      event: "notify_added_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

export async function notifyAbsenceRemoved(guild: Guild, player: string) {
  const traceId = createTraceId();

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  try {
    await channel.send(`🚀 **${player}** has returned, absence cleared!`);
    await updateAbsenceEmbed(guild);
  } catch (err) {
    logger.emit({
      scope: "absence.notification",
      event: "notify_removed_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

export async function notifyAbsenceAutoClean(guild: Guild, player: string) {
  const traceId = createTraceId();

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  try {
    await channel.send(`🚀 **${player}** has returned, absence cleared!`);
    await updateAbsenceEmbed(guild);
  } catch (err) {
    logger.emit({
      scope: "absence.notification",
      event: "notify_autoclean_failed",
      traceId,
      level: "error",
      error: err,
    });
  }
}

// -----------------------------
// AUTO CLEANER
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15 * 60 * 1000) {

  setInterval(async () => {
    await updateAbsenceEmbed(guild);
  }, 60_000);

  setInterval(async () => {

    const absences = await AS.getAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {

      const endDate = parseAbsenceDate(
        a.endDate,
        a.year ?? now.getFullYear()
      );

      if (endDate && endDate < now) {
        await AS.removeAbsence(guild.id, a.player);
        await notifyAbsenceAutoClean(guild, a.player);
      }
    }

  }, intervalMs);
}

// -----------------------------
// INIT
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  await updateAbsenceEmbed(guild);
}