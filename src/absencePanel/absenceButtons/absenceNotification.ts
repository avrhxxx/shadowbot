// src/absencePanel/absenceButtons/absenceNotification.ts
import { Guild, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "../absenceService";

// -----------------------------
// FETCH CHANNEL FROM SETTINGS
// -----------------------------
export async function getNotificationChannel(guild: Guild): Promise<TextChannel | null> {
  const config = await AS.getAbsenceConfig(guild.id);
  if (!config.notificationChannel) return null;

  const channel = guild.channels.cache.get(config.notificationChannel);
  if (!channel || !channel.isTextBased()) return null;

  return channel as TextChannel;
}

// -----------------------------
// CHECK ABSENCES & UPDATE EMBED
// -----------------------------
export async function updateAbsenceNotifications(guild: Guild) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return; // brak ustawionego kanału

  const guildId = guild.id;
  const absences = await AS.loadAbsences(guildId);
  const now = new Date();

  // Aktywne absencje
  const activeAbsences = absences.filter(a => new Date(a.endDate) >= now);

  // Discordowy Unix timestamp w sekundach
  const unixNow = Math.floor(Date.now() / 1000);

  // Embed z listą
  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setDescription(
      activeAbsences.length
        ? activeAbsences.map(a => `**${a.player}**: from ${a.startDate} to ${a.endDate}`).join("\n")
        : "No active absences"
    )
    .addFields({ name: "Last Update", value: `<t:${unixNow}:F>` })
    .setColor("Blue");

  try {
    const config = await AS.getAbsenceConfig(guildId);
    let message;

    if (config.absenceEmbedId) {
      // Edytuj istniejący embed
      message = await channel.messages.fetch(config.absenceEmbedId);
      await message.edit({ embeds: [embed] });
    } else {
      // Utwórz nową wiadomość z embedem
      message = await channel.send({ embeds: [embed] });
      await AS.setConfig(guildId, "absenceEmbedId", message.id);
    }

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
// AUTO CLEANER INTERVAL
// -----------------------------
export function startAbsenceAutoCleaner(guild: Guild, intervalMs = 15 * 60 * 1000) {
  setInterval(async () => {
    const channel = await getNotificationChannel(guild);
    if (!channel) return;

    const absences = await AS.loadAbsences(guild.id);
    const now = new Date();

    for (const a of absences) {
      if (new Date(a.endDate) < now) {
        // Usuń zakończone absencje
        await AS.deleteAbsenceRow(a.id);
        await channel.send(`Absence of **${a.player}** has ended and was removed.`);
      }
    }

    // Odśwież embed po usunięciu
    await updateAbsenceNotifications(guild);
  }, intervalMs);
}

// -----------------------------
// MAIN INIT FUNCTION
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  // Od razu aktualizuj listę
  await updateAbsenceNotifications(guild);

  // Start auto-cleaner co 15 minut
  startAbsenceAutoCleaner(guild);
}