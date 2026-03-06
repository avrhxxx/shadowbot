// src/eventsPanel/eventsButtons/eventsShowAll.ts
import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  Guild,
  Message
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { handleCompareAll, handleCompareAllDownload } from "./eventsCompare";
import { handleDownload } from "./eventsDownload";
import { isHeavyLoad, sendHeavyReport } from "../eventsHelpers/heavyReportHelper";

/**
 * Show All Events Panel
 */
export async function handleShowAllEvents(interaction: ButtonInteraction) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const events = await getEvents(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  // 🔹 Duży load → zapytaj użytkownika, czy chce plik
  if (isHeavyLoad(events)) {
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("heavy_report_yes").setLabel("✅ Yes, generate file").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("heavy_report_no").setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: "⚠️ This report is very large. Do you want to generate it as a text file in the download channel?",
      components: [confirmRow],
      ephemeral: true
    });

    // Listener dla przycisków
    const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector?.on("collect", async (i: ButtonInteraction) => {
      if (i.customId === "heavy_report_yes") {
        await i.update({ content: "Generating heavy report...", components: [] });
        const config = await EventStorage.getConfig(guildId);
        await sendHeavyReport(guild, events, config?.downloadChannelId);
        await i.followUp({ content: "Heavy report generated in download channel.", ephemeral: true });
      } else if (i.customId === "heavy_report_no") {
        await i.update({ content: "Report generation cancelled.", components: [] });
      }
    });

    return;
  }

  // 🔹 Normalna lista
  const listText = events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
      const statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "⚪" : "🔴";
      return `• ${statusEmoji} **${e.name}** — ${date} (${e.status})`;
    })
    .join("\n");

  const compareBtn = new ButtonBuilder().setCustomId("compare_all_events").setLabel("Compare All").setStyle(ButtonStyle.Primary);
  const downloadBtn = new ButtonBuilder().setCustomId("download_all_events").setLabel("Download All").setStyle(ButtonStyle.Secondary);
  const showListsBtn = new ButtonBuilder().setCustomId("show_all_lists").setLabel("Show All Lists").setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(compareBtn, downloadBtn, showListsBtn);

  await interaction.reply({ content: `📅 **All Events**\n\n${listText}`, components: [row], ephemeral: true });
}

/**
 * Show all participant lists
 */
export async function handleShowAllLists(interaction: ButtonInteraction) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const events = await getEvents(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  // 🔹 Duży load → zapytaj użytkownika
  if (isHeavyLoad(events)) {
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("heavy_report_yes").setLabel("✅ Yes, generate file").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("heavy_report_no").setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: "⚠️ This participant list is very large. Generate it as a text file in the download channel?",
      components: [confirmRow],
      ephemeral: true
    });

    const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector?.on("collect", async (i: ButtonInteraction) => {
      if (i.customId === "heavy_report_yes") {
        await i.update({ content: "Generating heavy report...", components: [] });
        const config = await EventStorage.getConfig(guildId);
        await sendHeavyReport(guild, events, config?.downloadChannelId);
        await i.followUp({ content: "Heavy report generated in download channel.", ephemeral: true });
      } else if (i.customId === "heavy_report_no") {
        await i.update({ content: "Report generation cancelled.", components: [] });
      }
    });

    return;
  }

  // 🔹 Mały load → generujemy embed z listą uczestników
  const fullText = events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = `${e.day}/${e.month} ${e.hour}:${e.minute} UTC`;
      const status = e.status;
      const participants = e.participants.length ? e.participants.join("\n") : "None";
      const absent = e.absent?.length ? e.absent.join("\n") : "None";
      return `**${e.name}** — ${date} (${status})\nParticipants:\n${participants}\nAbsent:\n${absent}`;
    })
    .join("\n\n====================\n\n");

  // Tworzymy fragmenty
  const chunks = fullText.match(/[\s\S]{1,3900}/g) || [];

  const compareBtn = new ButtonBuilder().setCustomId("compare_all_events").setLabel("Compare All").setStyle(ButtonStyle.Primary);
  const downloadBtn = new ButtonBuilder().setCustomId("download_all_events").setLabel("Download All").setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(compareBtn, downloadBtn);

  for (let i = 0; i < chunks.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 All Event Participant Lists${chunks.length > 1 ? ` — part ${i + 1}` : ""}`)
      .setColor(0x00ff00)
      .setDescription(chunks[i]);

    if (i === 0) await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    else await interaction.followUp({ embeds: [embed], ephemeral: true });
  }
}