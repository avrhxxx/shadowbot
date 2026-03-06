// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { handleCompareAll } from "./eventsCompare";
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

  // 🔹 Sprawdzenie heavy load
  if (isHeavyLoad(events)) {
    await interaction.deferReply({ ephemeral: true });
    const config = await import("../eventStorage").then(m => m.getConfig(guildId));
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
 * Show all participant lists in embed (bez pobierania pliku)
 * Obsługuje fragmentację jeśli treść za długa
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
    const config = await import("../eventStorage").then(m => m.getConfig(guildId));
    await sendHeavyReport(guild, events, config?.downloadChannelId);
    await interaction.editReply({ content: "Heavy report generated in download channel.", components: [] });
    return;
  }

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

  const { fragmentText } = await import("../../helpers/heavyTaskHelper");
  const fragments = fragmentText(fullText, 3900);

  for (let i = 0; i < fragments.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 All Event Participant Lists${fragments.length > 1 ? ` — part ${i + 1}` : ""}`)
      .setColor(0x00ff00)
      .setDescription(fragments[i]);

    if (i === 0) await interaction.reply({ embeds: [embed], ephemeral: true });
    else await interaction.followUp({ embeds: [embed], ephemeral: true });
  }
}