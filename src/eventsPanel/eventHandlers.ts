// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { handleCompareAll } from "./eventsCompare";
import { handleDownload } from "./eventsDownload";

export async function handleShowAllEvents(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  // 🔹 jeśli brak eventów – tylko ephemeral wiadomość, bez panelu
  if (!events.length) {
    await interaction.reply({
      content: "No events found.",
      ephemeral: true
    });
    return;
  }

  // 🔹 sortowanie chronologiczne
  const sortedEvents = events.sort((a, b) => a.createdAt - b.createdAt);

  // 🔹 budowanie listy w formie stringów dla przycisków
  const list = sortedEvents
    .map(e => {
      const date = formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
      const statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "⚪" : "🔴";
      return `• ${statusEmoji} **${e.name}** — ${date} (${e.status})`;
    })
    .join("\n");

  // 🔹 przyciski: Compare All, Download All, Show All Lists
  const compareBtn = new ButtonBuilder()
    .setCustomId("compare_all_events")
    .setLabel("Compare All")
    .setStyle(ButtonStyle.Primary);

  const downloadBtn = new ButtonBuilder()
    .setCustomId("download_all_events")
    .setLabel("Download All")
    .setStyle(ButtonStyle.Secondary);

  const showAllListsBtn = new ButtonBuilder()
    .setCustomId("show_all_lists")
    .setLabel("Show All Lists")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(compareBtn, downloadBtn, showAllListsBtn);

  // 🔹 wysyłamy embed, jeśli Show All Lists zostanie kliknięty
  if (interaction.customId === "show_all_lists") {
    // Budujemy treść wszystkich list
    const fullMessage = sortedEvents.map(event => {
      const statusLabel =
        event.status === "PAST" ? "[PAST]" :
        event.status === "CANCELED" ? "[CANCELED]" :
        "[ACTIVE]";

      const participants = event.participants.length ? event.participants.join("\n") : "None";
      const absent = event.absent?.length ? event.absent.join("\n") : "None";
      const dateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

      return `**Event:** ${event.name}\n**Status:** ${statusLabel}\n**Date:** ${dateStr}\n**Participants:**\n${participants}\n**Absent:**\n${absent}`;
    }).join("\n\n====================\n\n");

    const embed = new EmbedBuilder()
      .setTitle("📋 All Event Lists")
      .setDescription(fullMessage)
      .setColor("Blue");

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    return;
  }

  // 🔹 standardowa wiadomość dla Show All
  await interaction.reply({
    content: `📅 **All Events**\n\n${list}`,
    components: [row],
    ephemeral: true
  });
}