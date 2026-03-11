// src/absencePanel/absenceButtons/absenceNotification.ts

import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "../absenceService";

// -----------------------------
// FETCH CHANNEL FROM SETTINGS
// -----------------------------
export async function getNotificationChannel(guild: Guild): Promise<TextChannel | null> {
  const config = await AS.getAbsenceConfig(guild.id);
  if (!config.notificationChannel) return null;

  try {
    const channel = await guild.channels.fetch(config.notificationChannel);
    if (!channel || !channel.isTextBased()) return null;
    return channel as TextChannel;
  } catch {
    return null;
  }
}

// -----------------------------
// EMBED UPDATE
// -----------------------------
export async function updateAbsenceNotifications(guild: Guild) {

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  const guildId = guild.id;
  const absences = await AS.loadAbsences(guildId);

  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setColor("Blue");

  if (!absences.length) {
    embed.setDescription("No active absences.");
  } else {
    const list = absences
      .map(a => `• **${a.player}** — ${a.startDate} → ${a.endDate}`)
      .join("\n");

    embed.setDescription(list);
  }

  const config = await AS.getAbsenceConfig(guildId);

  try {

    let message;

    if (config.absenceEmbedId) {

      try {
        message = await channel.messages.fetch(config.absenceEmbedId);
        await message.edit({ embeds: [embed] });
      } catch {

        message = await channel.send({ embeds: [embed] });
        await AS.setAbsenceEmbedId(guildId, message.id);

      }

    } else {

      message = await channel.send({ embeds: [embed] });
      await AS.setAbsenceEmbedId(guildId, message.id);

    }

    if (!message.pinned) {
      await message.pin().catch(() => {});
    }

  } catch (err) {
    console.error("Absence embed update error:", err);
  }
}

// -----------------------------
// NOTIFY ADD
// -----------------------------
export async function notifyAbsenceAdded(
  guild: Guild,
  player: string,
  from: string,
  to: string
) {

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  await channel.send(
    `Player **${player}** will be absent from ${from} to ${to}.`
  );

  await updateAbsenceNotifications(guild);
}

// -----------------------------
// NOTIFY REMOVE
// -----------------------------
export async function notifyAbsenceRemoved(
  guild: Guild,
  player: string
) {

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  await channel.send(
    `Player **${player}** is back and no longer listed as absent.`
  );

  await updateAbsenceNotifications(guild);
}

// -----------------------------
// AUTO REFRESH (1 MIN)
// -----------------------------
export function startAbsenceAutoRefresh(
  guild: Guild,
  intervalMs = 60 * 1000
) {

  setInterval(async () => {

    try {
      await updateAbsenceNotifications(guild);
    } catch (err) {
      console.error("Absence auto refresh error:", err);
    }

  }, intervalMs);
}

// -----------------------------
// AUTO CLEANER (15 MIN)
// -----------------------------
export function startAbsenceAutoCleaner(
  guild: Guild,
  intervalMs = 15 * 60 * 1000
) {

  setInterval(async () => {

    const channel = await getNotificationChannel(guild);
    if (!channel) return;

    const absences = await AS.loadAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {

      const end = new Date(a.endDate);

      if (end < now) {

        await AS.deleteAbsenceRow(a.id);

        await channel.send(
          `Player **${a.player}** is back and no longer listed as absent.`
        );

      }

    }

    await updateAbsenceNotifications(guild);

  }, intervalMs);
}

// -----------------------------
// INIT
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {

  await updateAbsenceNotifications(guild);

  startAbsenceAutoRefresh(guild);
  startAbsenceAutoCleaner(guild);

}