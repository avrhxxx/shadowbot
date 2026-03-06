import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  TextChannel, 
  Guild 
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { handleCompareAll, handleCompareAllDownload } from "./eventsCompare";
import { isHeavyLoad } from "../eventsHelpers/heavyReportHelper";
import { sendHeavyReport } from "../eventsHelpers/heavyReportHelper";

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

  // 🔹 Sprawdzamy czy mamy heavy load
  if (isHeavyLoad(events)) {
    // Tworzymy przyciski do potwierdzenia generowania dużego pliku
    const yesBtn = new ButtonBuilder().setCustomId("heavy_report_yes").setLabel("Yes").setStyle(ButtonStyle.Success);
    const noBtn = new ButtonBuilder().setCustomId("heavy_report_no").setLabel("No").setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(yesBtn, noBtn);

    await interaction.reply({
      content: "⚠️ This report is very large. Do you want to generate it as a text file in the download channel?",
      components: [row],
      ephemeral: true
    });

    // ❌ Usuwamy lokalny collector – globalny handler już obsłuży kliknięcia
    return;
  }

  // 🔹 Normalna lista wydarzeń
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

  // 🔹 Heavy load → wysyłamy do download channel
  if (isHeavyLoad(events)) {
    const config = await EventStorage.getConfig(guildId);
    await sendHeavyReport(guild, events, config?.downloadChannelId);
    await interaction.reply({ content: "Heavy report generated in download channel.", ephemeral: true });
    return;
  }

  // 🔹 Mały load → embed z listą uczestników
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

  // 🔹 Tworzymy fragmenty embedów (max 3900 znaków)
  const chunks = fullText.match(/[\s\S]{1,3900}/g) || [];

  const compareBtn = new ButtonBuilder().setCustomId("compare_all_events").setLabel("Compare All").setStyle(ButtonStyle.Primary);
  const downloadBtn = new ButtonBuilder().setCustomId("download_all_events").setLabel("Download All").setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(compareBtn, downloadBtn);

  for (let i = 0; i < chunks.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 All Event Participant Lists${chunks.length > 1 ? ` — part ${i + 1}` : ""}`)
      .setColor(0x00ff00)
      .setDescription(chunks[i]);

    if (i === 0) await interaction.reply({ embeds: [embed], components: row ? [row] : [], ephemeral: true });
    else await interaction.followUp({ embeds: [embed], ephemeral: true });
  }
}