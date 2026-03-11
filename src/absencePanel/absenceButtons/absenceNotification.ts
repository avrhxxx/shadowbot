// src/absencePanel/absenceButtons/absenceNotification.ts
import { Guild, TextChannel, EmbedBuilder, ChannelType } from "discord.js";
import * as AS from "../absenceService";

// -----------------------------
// CHANNEL CREATION & EMBED MANAGEMENT
// -----------------------------
export async function ensureAwayBoardChannel(guild: Guild): Promise<TextChannel> {
  const channelName = "away-board";
  let channel = guild.channels.cache.find(
    (c) => c.name === channelName && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      reason: "Absence Board channel for notifications",
    });
  }

  return channel;
}

// -----------------------------
// CHECK ABSENCES & NOTIFICATIONS
// -----------------------------
export async function updateAbsenceNotifications(guildId: string, channel: TextChannel) {
  const absences = await AS.loadAbsences(guildId);
  const now = new Date();

  // Filtrujemy aktywne absencje
  const activeAbsences = absences.filter((a: AS.AbsenceObject) => new Date(a.endDate) >= now);

  // Przygotowujemy embed z listą absencji
  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setDescription(
      activeAbsences.length
        ? activeAbsences
            .map((a: AS.AbsenceObject) => `**${a.player}**: from ${a.startDate} to ${a.endDate}`)
            .join("\n")
        : "No active absences"
    )
    .setColor("Blue")
    .setTimestamp();

  // Sprawdzamy, czy istnieje wiadomość z embedem (przechowujemy ID w service lub config)
  const config = await AS.getAbsenceConfig(guildId);
  let message;
  try {
    if (config.absenceEmbedId) {
      message = await channel.messages.fetch(config.absenceEmbedId);
      await message.edit({ embeds: [embed] });
    } else {
      message = await channel.send({ embeds: [embed] });
      await AS.setConfig(guildId, "absenceEmbedId", message.id);
    }
  } catch (err) {
    console.error("Error updating absence embed:", err);
  }

  // Powiadomienia dla nowych absencji
  const toNotify = activeAbsences.filter((a: AS.AbsenceObject) => !a.notified);
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
export function startAbsenceAutoCleaner(guildId: string, channel: TextChannel, intervalMs = 15 * 60 * 1000) {
  setInterval(async () => {
    const absences = await AS.loadAbsences(guildId);
    const now = new Date();

    for (const a of absences) {
      if (new Date(a.endDate) < now) {
        // Usuń zakończone absencje
        await AS.deleteAbsenceRow(a.id);
        await channel.send(`Absence of **${a.player}** has ended and was removed.`);
      }
    }

    // Zaktualizuj embed po usunięciu
    await updateAbsenceNotifications(guildId, channel);
  }, intervalMs);
}

// -----------------------------
// MAIN INITIALIZATION
// -----------------------------
export async function initAbsenceNotifications(guild: Guild) {
  const channel = await ensureAwayBoardChannel(guild);
  const guildId = guild.id;

  // Od razu zaktualizuj listę
  await updateAbsenceNotifications(guildId, channel);

  // Uruchom automatyczny cleaner co 15 minut
  startAbsenceAutoCleaner(guildId, channel, 15 * 60 * 1000);
}