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
  if (!channel) return;

  const absences = await AS.loadAbsences(guild.id);
  const now = new Date();

  // Filtrujemy aktywne absencje
  const activeAbsences = absences.filter(a => new Date(a.endDate) >= now);

  // Przygotowujemy embed
  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setDescription(
      activeAbsences.length
        ? activeAbsences
            .map(a => `**${a.player}**: from ${a.startDate} to ${a.endDate}`)
            .join("\n")
        : "No active absences"
    )
    .setColor("Blue")
    .setTimestamp();

  // Pobieramy lub tworzymy wiadomość z embedem
  const config = await AS.getAbsenceConfig(guild.id);
  let message;
  try {
    if (config.absenceEmbedId) {
      message = await channel.messages.fetch(config.absenceEmbedId);
      await message.edit({ embeds: [embed] });
    } else {
      message = await channel.send({ embeds: [embed] });
      await AS.setConfig(guild.id, "absenceEmbedId", message.id);
    }
  } catch (err) {
    console.error("Error updating absence embed:", err);
  }

  // Powiadomienia dla nowych absencji
  const toNotify = activeAbsences.filter(a => !a.notified);
  for (const absence of toNotify) {
    await channel.send(
      `Player **${absence.player}** will be absent from ${absence.startDate} to ${absence.endDate}.`
    );
    await AS.updateAbsenceCell(absence.id, "notified", true);
  }
}

// -----------------------------
// AUTO CLEANER
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

    // Zaktualizuj embed po usunięciu
    await updateAbsenceNotifications(guild);
  }, intervalMs);
}

// -----------------------------
// MAIN INITIALIZATION
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  const channel = await getNotificationChannel(guild);
  if (!channel) return;

  // Od razu zaktualizuj listę
  await updateAbsenceNotifications(guild);

  // Uruchom automatyczny cleaner co 15 minut
  startAbsenceAutoCleaner(guild, 15 * 60 * 1000);
}