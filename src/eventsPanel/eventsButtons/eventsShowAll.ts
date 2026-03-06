// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { handleCompareAll } from "./eventsCompare";
import { handleDownload } from "./eventsDownload";
import { fragmentText } from "../../helpers/heavyTaskHelper";

/**
 * Show All Events Panel
 * - Compare All
 * - Download All
 * - Show All Lists (embed)
 */
export async function handleShowAllEvents(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  if (!events.length) {
    await interaction.reply({
      content: "No events found.",
      ephemeral: true
    });
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

  const compareBtn = new ButtonBuilder()
    .setCustomId("compare_all_events")
    .setLabel("Compare All")
    .setStyle(ButtonStyle.Primary);

  const downloadBtn = new ButtonBuilder()
    .setCustomId("download_all_events")
    .setLabel("Download All")
    .setStyle(ButtonStyle.Secondary);

  const showListsBtn = new ButtonBuilder()
    .setCustomId("show_all_lists")
    .setLabel("Show All Lists")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(compareBtn, downloadBtn, showListsBtn);

  await interaction.reply({
    content: `📅 **All Events**\n\n${listText}`,
    components: [row],
    ephemeral: true
  });
}

/**
 * Show all participant lists in embed (bez pobierania pliku)
 * - obsługuje fragmentację jeśli treść za długa
 */
export async function handleShowAllLists(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  let fullText = events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = `${e.day}/${e.month} ${e.hour}:${e.minute} UTC`;
      const status = e.status;
      const participants = e.participants.length ? e.participants.join("\n") : "None";
      const absent = e.absent?.length ? e.absent.join("\n") : "None";
      return `**${e.name}** — ${date} (${status})\nParticipants:\n${participants}\nAbsent:\n${absent}`;
    })
    .join("\n\n====================\n\n");

  // Fragmentacja jeśli treść za długa dla Discord embed
  const fragments = fragmentText(fullText, 3900); // 4000 znaków max w embed description

  for (let i = 0; i < fragments.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 All Event Participant Lists${fragments.length > 1 ? ` — part ${i + 1}` : ""}`)
      .setColor(0x00ff00)
      .setDescription(fragments[i]);

    if (i === 0) {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  }
}