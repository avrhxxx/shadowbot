import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "../absenceService";

// -----------------------------
// HELPERS
// -----------------------------
function formatAbsenceDate(dateStr: string, year: number): string {
  const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) return dateStr;
  const day = Number(match[1]).toString().padStart(2, "0");
  const month = Number(match[2]).toString().padStart(2, "0");
  return `${day}.${month}`;
}

function parseAbsenceDate(dateStr: string, year: number): Date | null {
  const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  return new Date(year, month, day);
}

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// -----------------------------
// GET CHANNEL
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
export async function updateAbsenceEmbed(guild: Guild) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  const absences = await AS.loadAbsences(guild.id);
  const now = new Date();
  const unixNow = Math.floor(now.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle("📋 Absence List")
    .setColor("Blue");

  if (!absences.length) {
    embed.setDescription("No active absences.");
  } else {
    const grouped: Record<string, string[]> = {};

    for (const a of absences) {
      const endDate = parseAbsenceDate(a.endDate, a.year ?? new Date().getFullYear());
      if (!endDate) continue;
      const backStr = formatAbsenceDate(a.endDate, a.year ?? new Date().getFullYear());
      const remainingDays = daysUntil(endDate);
      const line = `• 👤 ${a.player} (${remainingDays} day${remainingDays !== 1 ? "s" : ""})`;
      if (!grouped[backStr]) grouped[backStr] = [];
      grouped[backStr].push(line);
    }

    const sortedBackDates = Object.keys(grouped).sort((a, b) => {
      const d1 = parseAbsenceDate(a, new Date().getFullYear())?.getTime() ?? 0;
      const d2 = parseAbsenceDate(b, new Date().getFullYear())?.getTime() ?? 0;
      return d1 - d2;
    });

    for (const back of sortedBackDates) {
      embed.addFields({ name: `📅 Back on ${back}`, value: grouped[back].join("\n"), inline: false });
    }
  }

  embed.addFields({ name: "Last Update", value: `<t:${unixNow}:F>` });

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

    if (!message.pinned) await message.pin().catch(() => {});
  } catch (err) {
    console.error("Error updating absence embed:", err);
  }
}

// -----------------------------
// NOTIFICATIONS
// -----------------------------
export async function notifyAbsenceAdded(guild: Guild, player: string, startDate: string, endDate: string) {
  const absences = await AS.loadAbsences(guild.id);
  const absence = absences.find(a => a.player === player);
  const year = absence?.year ?? new Date().getFullYear();

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  await channel.send(`📌 ${player} is now absent from ${formatAbsenceDate(startDate, year)} to ${formatAbsenceDate(endDate, year)}.`);
  await updateAbsenceEmbed(guild);
}

export async function notifyAbsenceRemoved(guild: Guild, player: string) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  await channel.send(`✅ ${player}'s absence has ended — welcome back!`);
  await updateAbsenceEmbed(guild);
}

export async function notifyAbsenceAutoClean(guild: Guild, player: string) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  await channel.send(`✅ ${player}'s absence period has ended — back to the game!`);
  await updateAbsenceEmbed(guild);
}

// -----------------------------
// AUTO CLEANER + PERIODIC UPDATE
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15 * 60 * 1000) {
  // Embed update co minutę
  setInterval(async () => {
    await updateAbsenceEmbed(guild);
  }, 60_000);

  // Auto-clean co 15 minut
  setInterval(async () => {
    const absences = await AS.loadAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {
      const endDate = parseAbsenceDate(a.endDate, a.year ?? new Date().getFullYear());
      if (endDate && endDate < now) {
        await AS.deleteAbsenceRow(a.id);
        await notifyAbsenceAutoClean(guild, a.player);
      }
    }
  }, intervalMs);
}

// -----------------------------
// INITIALIZE ABSENCE EMBED
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  await updateAbsenceEmbed(guild);
}