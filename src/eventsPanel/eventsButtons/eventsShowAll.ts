// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { handleCompareAll } from "./eventsCompare";
import { handleDownload } from "./eventsDownload";
import { isHeavyLoad, sendHeavyReport, generateReportFragments } from "../eventsHelpers/heavyReportHelper";

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

  // 🔹 Sprawdzenie heavy load
  if (isHeavyLoad(events)) {
    await interaction.deferReply({ ephemeral: true });
    const config = await EventStorage.getConfig(guildId);
    await sendHeavyReport(guild, events, config?.downloadChannelId);
    await interaction.editReply({ content: "Heavy report generated in download channel.", components: [] });
    return;
  }

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
 * Show all participant lists in embeds (fragmented if too long)
 */
export async function handleShowAllLists(interaction: ButtonInteraction) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const events = await getEvents(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  if (isHeavyLoad(events)) {
    await interaction.deferReply({ ephemeral: true });
    const config = await EventStorage.getConfig(guildId);
    await sendHeavyReport(guild, events, config?.downloadChannelId);
    await interaction.editReply({ content: "Heavy report generated in download channel.", components: [] });
    return;
  }

  // 🔹 Generowanie fragmentów z heavyReportHelper
  const { embedFragments } = generateReportFragments(events);

  for (let i = 0; i < embedFragments.length; i++) {
    const embed = embedFragments[i];
    if (i === 0) await interaction.reply({ embeds: [embed], ephemeral: true });
    else await interaction.followUp({ embeds: [embed], ephemeral: true });
  }
}