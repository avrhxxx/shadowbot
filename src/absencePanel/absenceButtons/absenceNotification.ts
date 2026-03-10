// src/absencePanel/absenceNotification.ts
import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { getAbsences, AbsenceObject, getAbsenceConfig, setConfig } from "../absencePanel/absenceService";

const AUTO_CLEAN_INTERVAL_MIN = 15;

interface NotificationState {
  channelId?: string;
  embedId?: string;
}

export class AbsenceNotifier {
  private client: Client;
  private guildId: string;
  private state: NotificationState = {};

  constructor(client: Client, guildId: string) {
    this.client = client;
    this.guildId = guildId;
    this.init();
  }

  private async init() {
    const config = await getAbsenceConfig(this.guildId);
    this.state.channelId = config.notificationChannel ?? undefined;
    this.state.embedId = config.absenceEmbedId ?? undefined;

    this.startAutoClean();
  }

  /** Wyślij powiadomienie o dodaniu absencji */
  public async notifyAdd(absence: AbsenceObject) {
    if (!this.state.channelId) return;
    const channel = this.client.channels.cache.get(this.state.channelId) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("📌 New Absence Added")
      .setColor(0x1E90FF)
      .setDescription(`Player **${absence.player}** will be absent from **${absence.startDate}** to **${absence.endDate}**.`)
      .setTimestamp(new Date());

    await channel.send({ embeds: [embed] });
    await this.updateAbsenceListEmbed();
  }

  /** Wyślij powiadomienie o usunięciu absencji */
  public async notifyRemove(absence: AbsenceObject, reason: string = "manual") {
    if (!this.state.channelId) return;
    const channel = this.client.channels.cache.get(this.state.channelId) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("✅ Absence Removed")
      .setColor(0x32CD32)
      .setDescription(`Player **${absence.player}** absence removed (${reason}).`)
      .setTimestamp(new Date());

    await channel.send({ embeds: [embed] });
    await this.updateAbsenceListEmbed();
  }

  /** Utwórz / zaktualizuj embed listy absencji */
  private async updateAbsenceListEmbed() {
    if (!this.state.channelId) return;
    const channel = this.client.channels.cache.get(this.state.channelId) as TextChannel;
    if (!channel) return;

    const absences = await getAbsences(this.guildId);
    const embed = new EmbedBuilder()
      .setTitle("📋 Current Absences")
      .setColor(0x1E90FF)
      .setTimestamp(new Date());

    if (absences.length === 0) {
      embed.setDescription("✅ No absences recorded.");
    } else {
      for (const absence of absences) {
        embed.addFields({
          name: absence.player,
          value: `${absence.startDate} → ${absence.endDate}`,
          inline: false,
        });
      }
    }

    try {
      if (this.state.embedId) {
        const msg = await channel.messages.fetch(this.state.embedId);
        await msg.edit({ embeds: [embed] });
      } else {
        const msg = await channel.send({ embeds: [embed] });
        this.state.embedId = msg.id;
        await setConfig(this.guildId, "absenceEmbedId", msg.id);
      }
    } catch (err) {
      console.error("Error updating absence embed:", err);
    }
  }

  /** Automatyczne czyszczenie przeterminowanych absencji */
  private startAutoClean() {
    setInterval(async () => {
      const absences = await getAbsences(this.guildId);
      const now = new Date();
      for (const absence of absences) {
        const [toDay, toMonth] = absence.endDate.split("/").map(Number);
        const toDate = new Date(now.getFullYear(), toMonth - 1, toDay, 23, 59, 59);
        if (toDate < now) {
          await this.notifyRemove(absence, "auto-clean");
        }
      }
    }, AUTO_CLEAN_INTERVAL_MIN * 60 * 1000);
  }
}