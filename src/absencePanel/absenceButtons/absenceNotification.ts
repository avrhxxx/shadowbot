// src/absencePanel/absenceButtons/absenceNotification.ts
import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "../absenceService";

// -----------------------------
// HELPERS
// -----------------------------
function formatAbsenceDate(dateStr: string): string {
  const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) return dateStr;
  const day = Number(match[1]).toString().padStart(2, "0");
  const month = Number(match[2]).toString().padStart(2, "0");
  const year = new Date().getFullYear();
  return `${day}.${month}.${year}`;
}

function parseAbsenceDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1; // JS months 0-11
  const year = new Date().getFullYear();
  return new Date(year, month, day);
}

// -----------------------------
// GET CHANNEL FROM SETTINGS
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
// UPDATE EMBED & NOTIFICATIONS
// -----------------------------
export async function updateAbsenceNotifications(guild: Guild) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  const guildId = guild.id;
  const absences = await AS.loadAbsences(guildId);
  const now = new Date();
  const unixNow = Math.floor(now.getTime() / 1000);

  const activeAbsences = absences.filter(a => {
    const end = parseAbsenceDate(a.endDate);
    return end && end >= now;
  });

  const embed = new EmbedBuilder().setTitle("Absence List").setColor("Blue");

  if (!activeAbsences.length) {
    embed.setDescription("No active absences.");
  } else {
    embed.setDescription(
      activeAbsences
        .map(a => {
          const endDate = parseAbsenceDate(a.endDate);
          const backStr = endDate ? `<t:${Math.floor(endDate.getTime() / 1000)}:R>` : "Unknown";
          return `• **${a.player}** — ${formatAbsenceDate(a.startDate)} → ${formatAbsenceDate(a.endDate)} (Back: ${backStr})`;
        })
        .join("\n")
    );
  }

  embed.addFields({ name: "Last Update", value: `<t:${unixNow}:F>` });

  try {
    const config = await AS.getAbsenceConfig(guildId);
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

    if (!message.pinned) await message.pin().catch(() => {});

    // -----------------------------
    // POWIADOMIENIA DLA NOWYCH ABSENCJI
    // -----------------------------
    const toNotify = activeAbsences.filter(a => !a.notified);
    for (const absence of toNotify) {
      const fromDate = formatAbsenceDate(absence.startDate);
      const toDate = formatAbsenceDate(absence.endDate);
      await channel.send(`✨ Player **${absence.player}** will be absent from ${fromDate} to ${toDate}.`);
      // natychmiast ustawiamy notified = true
      await AS.updateAbsenceCell(absence.id, "notified", true);
    }
  } catch (err) {
    console.error("Error updating absence embed:", err);
  }
}

// -----------------------------
// AUTO REFRESH 1 MIN (TYLKO EMBED)
// -----------------------------
export function startAbsenceAutoRefresh(guild: Guild, intervalMs = 60 * 1000) {
  setInterval(async () => {
    try {
      const channel = await getNotificationChannel(guild);
      if (!channel) return;
      // tylko embed, bez dodatkowych powiadomień
      await updateAbsenceNotifications(guild);
    } catch {}
  }, intervalMs);
}

// -----------------------------
// AUTO CLEANER 15 MIN
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15 * 60 * 1000) {
  setInterval(async () => {
    const channel = await getNotificationChannel(guild);
    if (!channel) return;

    const absences = await AS.loadAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {
      const endDate = parseAbsenceDate(a.endDate);
      if (endDate && endDate < now) {
        await AS.deleteAbsenceRow(a.id);
        await channel.send(`🎉 Player **${a.player}** is back and no longer listed as absent.`);
      }
    }

    await updateAbsenceNotifications(guild);
  }, intervalMs);
}

// -----------------------------
// MAIN INIT
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  await updateAbsenceNotifications(guild);
  startAbsenceAutoRefresh(guild);
  startAbsenceAutoCleaner(guild);
}