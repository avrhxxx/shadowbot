import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "../absenceService";
import { AbsenceObject } from "../absenceService";

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

  const absences = await AS.getAbsences(guild.id); // 🔥 FIX
  const now = new Date();
  const unixNow = Math.floor(now.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle("📋 Absence List")
    .setColor("Blue");

  if (!absences.length) {
    embed.setDescription("No active absences.");
  } else {
    const byBackDate: Record<string, string[]> = {};

    absences.forEach((a: AbsenceObject) => {
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
        .sort()
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

    if (!message.pinned) await message.pin().catch(() => {});
  } catch (err) {
    console.error("Error updating absence embed:", err);
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
  const absences = await AS.getAbsences(guild.id); // 🔥 FIX
  const absence = absences.find(a => a.player === player);

  const year = absence?.year ?? new Date().getFullYear();
  const end = parseAbsenceDate(endDate, year);

  const unixBack = end ? Math.floor(end.getTime() / 1000) : 0;

  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  await channel.send(
    `📌 Player **${player}** is now absent from ${formatAbsenceDate(startDate, year)} to ${formatAbsenceDate(endDate, year)} (returns <t:${unixBack}:R>).`
  );

  await updateAbsenceEmbed(guild);
}

// -----------------------------
// AUTO CLEANER
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15 * 60 * 1000) {
  setInterval(async () => {
    const absences = await AS.getAbsences(guild.id); // 🔥 FIX
    const now = new Date();

    for (const a of absences) {
      const endDate = parseAbsenceDate(a.endDate, a.year ?? now.getFullYear());

      if (endDate && endDate < now) {
        await AS.removeAbsence(guild.id, a.player); // 🔥 FIX
      }
    }
  }, intervalMs);
}