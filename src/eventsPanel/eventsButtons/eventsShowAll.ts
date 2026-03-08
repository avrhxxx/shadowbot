// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

const STATUS_EMOJIS: Record<string, string> = {
  ACTIVE: "🟢",
  PAST: "⚪",
  CANCELED: "🔴"
};

function createButtonRow(...buttons: ButtonBuilder[]) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
}

function createEventListText(events: any[]) {
  return events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
      const statusEmoji = STATUS_EMOJIS[e.status] ?? "❔";
      return `• ${statusEmoji} **${e.name}** — ${date} (${e.status})`;
    })
    .join("\n");
}

// ==========================
// SHOW ALL EVENTS
// ==========================
export async function handleShowAllEvents(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const events = await getEvents(interaction.guildId!);
  if (!events.length) return interaction.editReply({ content: "No events found." });

  const row = createButtonRow(
    new ButtonBuilder().setCustomId("compare_all_events").setLabel("Compare All").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("download_all_events").setLabel("Download All").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("show_all_lists").setLabel("Show All Lists").setStyle(ButtonStyle.Success)
  );

  const listText = createEventListText(events);
  await interaction.editReply({ content: `📅 **All Events**\n\n${listText}`, components: [row] });
}

// ==========================
// SHOW ALL PARTICIPANT LISTS
// ==========================
export async function handleShowAllLists(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const events = await getEvents(interaction.guildId!);
  if (!events.length) return interaction.editReply({ content: "No events found." });

  const fullText = events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = `${e.day}/${e.month} ${e.hour}:${e.minute} UTC`;
      const participants = e.participants.length ? e.participants.join("\n") : "None";
      const absent = e.absent?.length ? e.absent.join("\n") : "None";
      return `**${e.name}** — ${date} (${e.status})\nParticipants:\n${participants}\nAbsent:\n${absent}`;
    })
    .join("\n\n====================\n\n");

  const chunks = fullText.match(/[\s\S]{1,3900}/g) || [];

  for (let i = 0; i < chunks.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 All Event Participant Lists${chunks.length > 1 ? ` — part ${i + 1}` : ""}`)
      .setColor(0x00ff00)
      .setDescription(chunks[i]);

    if (i === 0) await interaction.editReply({ embeds: [embed] }); // ✅ pierwsza część
    else await interaction.followUp({ embeds: [embed], ephemeral: true }); // ✅ kolejne części
  }
}