// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

// Status emojis
const STATUS_EMOJIS: Record<string, string> = {
  ACTIVE: "🟢",
  PAST: "⚪",
  CANCELED: "🔴"
};

// Kategorie, dla których przyciski Compare / Download / Show All Lists są aktywne
const EVENT_TYPES_WITH_PARTICIPANTS = ["custom", "reservoir_raid"];

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

  // 🔹 pobieramy wszystkie eventy poza birthdays
  const events = (await getEvents(interaction.guildId!)).filter(e => e.eventType !== "birthdays");

  if (!events.length) {
    return interaction.editReply({ content: "No events found." });
  }

  // 🔹 przyciski Compare / Download / Show All Lists tylko dla Custom i Reservoir
  const participantEvents = events.filter(e => EVENT_TYPES_WITH_PARTICIPANTS.includes(e.eventType));

  const row = createButtonRow(
    new ButtonBuilder()
      .setCustomId("compare_all_events")
      .setLabel("Compare All")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(participantEvents.length === 0), // blokujemy jeśli brak odpowiednich eventów

    new ButtonBuilder()
      .setCustomId("download_all_events")
      .setLabel("Download All")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(participantEvents.length === 0),

    new ButtonBuilder()
      .setCustomId("show_all_lists")
      .setLabel("Show All Lists")
      .setStyle(ButtonStyle.Success)
      .setDisabled(participantEvents.length === 0)
  );

  const listText = createEventListText(events);

  await interaction.editReply({
    content: `📅 **All Events**\n\n${listText}`,
    components: [row]
  });
}

// ==========================
// SHOW ALL PARTICIPANT LISTS (Custom & Reservoir only)
// ==========================
export async function handleShowAllLists(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // 🔹 pobieramy tylko Custom i Reservoir eventy
  const events = (await getEvents(interaction.guildId!))
    .filter(e => EVENT_TYPES_WITH_PARTICIPANTS.includes(e.eventType));

  if (!events.length) {
    return interaction.editReply({ content: "No participant lists available for Custom/Reservoir events." });
  }

  const fullText = events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = `${e.day}/${e.month} ${e.hour}:${e.minute} UTC`;

      const participants = e.participants.length
        ? e.participants.join("\n")
        : "None";

      const absent = e.absent?.length
        ? e.absent.join("\n")
        : "None";

      return `**${e.name}** — ${date} (${e.status})
Participants:
${participants}

Absent:
${absent}`;
    })
    .join("\n\n====================\n\n");

  const chunks = fullText.match(/[\s\S]{1,3900}/g) || [];

  for (let i = 0; i < chunks.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 All Event Participant Lists${chunks.length > 1 ? ` — part ${i + 1}` : ""}`)
      .setColor(0x00ff00)
      .setDescription(chunks[i]);

    if (i === 0) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  }
}