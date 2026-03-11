import { Client, TextChannel, EmbedBuilder } from "discord.js";
import * as AS from "./absenceService";

let absenceEmbedMessageId: string | null = null;

export async function sendAbsenceNotification(client: Client, guildId: string, player: string, startDate: string, endDate: string, action: "add" | "remove") {
  const config = await AS.getAbsenceConfig(guildId);
  if (!config.notificationChannel) return;
  const channel = client.channels.cache.get(config.notificationChannel) as TextChannel;
  if (!channel) return;

  if (!absenceEmbedMessageId) {
    const embed = new EmbedBuilder()
      .setTitle("Absence List")
      .setDescription("Current absences will appear here.")
      .setColor("Yellow")
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    absenceEmbedMessageId = msg.id;
  }

  const embedMsg = await channel.messages.fetch(absenceEmbedMessageId);
  const absences = await AS.getAbsences(guildId);

  const embed = new EmbedBuilder()
    .setTitle("Absence List")
    .setColor("Yellow")
    .setDescription(absences.map(a => `${a.player}: ${a.startDate} → ${a.endDate}`).join("\n") || "No absences")
    .setFooter({ text: `Last update: ${new Date().toLocaleString()}` });

  await embedMsg.edit({ embeds: [embed] });

  if (action === "add" || action === "remove") {
    const notificationEmbed = new EmbedBuilder()
      .setColor(action === "add" ? "Green" : "Red")
      .setDescription(action === "add"
        ? `${player} will be absent from ${startDate} to ${endDate}`
        : `${player} absence removed.`);

    const notifMsg = await channel.send({ embeds: [notificationEmbed] });
    setTimeout(() => notifMsg.delete().catch(() => {}), 24 * 60 * 60 * 1000);
  }
}

// -------------------------
// AUTO-CLEANER
// -------------------------
export function startAbsenceAutoCleaner(client: Client, guildId: string) {
  setInterval(async () => {
    const absences = await AS.getAbsences(guildId);
    const now = Date.now();
    const toRemove = absences.filter(a => new Date(a.endDate).getTime() < now);

    for (const a of toRemove) {
      await AS.removeAbsence(guildId, a.player);
      await sendAbsenceNotification(client, guildId, a.player, a.startDate, a.endDate, "remove");
    }
  }, 15 * 60 * 1000);
}