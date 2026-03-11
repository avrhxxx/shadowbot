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
  let day = Number(match[1]);
  let month = Number(match[2]) - 1;
  let year = new Date().getFullYear();
  if (new Date(year, month, day).getTime() < Date.now() && month < new Date().getMonth()) year += 1;
  return new Date(year, month, day);
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
// NOTIFICATIONS
// -----------------------------
export async function notifyAbsenceAdded(guild: Guild, player: string, startDate: string, endDate: string) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;
  await channel.send(`📌 Player ${player} is now absent from ${formatAbsenceDate(startDate)} to ${formatAbsenceDate(endDate)}.`);
}

export async function notifyAbsenceRemoved(guild: Guild, player: string) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;
  await channel.send(`📌 Player ${player} has returned and is no longer absent.`);
}

export async function notifyAbsenceAutoClean(guild: Guild, player: string) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;
  await channel.send(`📌 Player ${player} was automatically removed after absence ended.`);
}

// -----------------------------
// EMBED ONLY
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  const absences = await AS.loadAbsences(guild.id);
  const now = new Date();
  const unixNow = Math.floor(now.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setColor("Blue");

  if (!absences.length) {
    embed.setDescription("No active absences.");
  } else {
    embed.setDescription(
      absences.map(a => {
        const endDate = parseAbsenceDate(a.endDate);
        const backStr = endDate ? `<t:${Math.floor(endDate.getTime()/1000)}:R>` : "Unknown";
        return `• ${a.player} — ${formatAbsenceDate(a.startDate)} → ${formatAbsenceDate(a.endDate)} (Back: ${backStr})`;
      }).join("\n")
    );
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
// AUTO CLEANER + NOTIFY
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15*60*1000) {
  setInterval(async () => {
    const absences = await AS.loadAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {
      const endDate = parseAbsenceDate(a.endDate);
      if (endDate && endDate < now) {
        await AS.deleteAbsenceRow(a.id);
        await notifyAbsenceAutoClean(guild, a.player);
      }
    }

    await initAbsenceNotifications(guild);
  }, intervalMs);
}