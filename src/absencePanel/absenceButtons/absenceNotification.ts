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
// CHECK ABSENCES & UPDATE EMBED
// -----------------------------
export async function updateAbsenceNotifications(guild: Guild) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  const guildId = guild.id;
  const absences = await AS.loadAbsences(guildId);
  const now = new Date();

  const activeAbsences = absences.filter(a => new Date(a.endDate) >= now);
  const unixNow = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setDescription(
      activeAbsences.length
        ? activeAbsences.map(a => `**${a.player}**: from ${a.startDate} to ${a.endDate}`).join("\n")
        : "No active absences"
    )
    .setColor("Blue")
    .addFields({ name: "Last Update", value: `<t:${unixNow}:F>` });

  try {
    const config = await AS.getAbsenceConfig(guildId);
    let message;

    if (config.absenceEmbedId) {
      try {
        message = await channel.messages.fetch(config.absenceEmbedId);
        await message.edit({ embeds: [embed] });
      } catch {
        // fallback: embed usunięty -> nowy
        message = await channel.send({ embeds: [embed] });
        await AS.setAbsenceEmbedId(guildId, message.id);
      }
    } else {
      message = await channel.send({ embeds: [embed] });
      await AS.setAbsenceEmbedId(guildId, message.id);
    }

    if (!message.pinned) await message.pin().catch(err => console.error("Failed to pin embed:", err));

    // Powiadomienia o nowych absencjach
    const toNotify = activeAbsences.filter(a => !a.notified);
    for (const absence of toNotify) {
      await channel.send(
        `Player **${absence.player}** will be absent from ${absence.startDate} to ${absence.endDate}.`
      );
      await AS.updateAbsenceCell(absence.id, "notified", true);
    }
  } catch (err) {
    console.error("Error updating absence embed:", err);
  }
}

// -----------------------------
// AUTO REFRESH (1 min)
// -----------------------------
export function startAbsenceAutoRefresh(guild: Guild, intervalMs = 60 * 1000) {
  setInterval(async () => {
    await updateAbsenceNotifications(guild);
  }, intervalMs);
}

// -----------------------------
// AUTO CLEANER (15 min)
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15 * 60 * 1000) {
  setInterval(async () => {
    const channel = await getNotificationChannel(guild);
    if (!channel) return;

    const absences = await AS.loadAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {
      if (new Date(a.endDate) < now) {
        await AS.deleteAbsenceRow(a.id);
        await channel.send(`Absence of **${a.player}** has ended and was removed.`);
      }
    }

    await updateAbsenceNotifications(guild);
  }, intervalMs);
}

// -----------------------------
// MAIN INIT FUNCTION
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  await updateAbsenceNotifications(guild);
  startAbsenceAutoRefresh(guild);
  startAbsenceAutoCleaner(guild);
}