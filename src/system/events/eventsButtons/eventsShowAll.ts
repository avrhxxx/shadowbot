// src/eventsPanel/eventsButtons/eventsShowAll.ts
import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} from "discord.js";

import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

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
  const traceId = createTraceId();

  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply({ ephemeral: true });

  const events = (await getEvents(guildId))
    .filter(e => e.eventType !== "birthdays");

  if (!events.length) {
    await interaction.editReply({ content: "No events found." });

    logger.emit({
      scope: "events.show_all",
      event: "no_events",
      traceId,
      context: { guildId },
    });

    return;
  }

  const participantEvents = events.filter(e =>
    EVENT_TYPES_WITH_PARTICIPANTS.includes(e.eventType)
  );

  const row = createButtonRow(
    new ButtonBuilder()
      .setCustomId("compare_all_events")
      .setLabel("Compare All")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(participantEvents.length === 0),

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

  logger.emit({
    scope: "events.show_all",
    event: "show_all_events",
    traceId,
    context: {
      guildId,
      totalEvents: events.length,
      participantEvents: participantEvents.length,
    },
  });
}

// ==========================
// SHOW ALL PARTICIPANT LISTS (Custom & Reservoir only)
// ==========================
export async function handleShowAllLists(interaction: ButtonInteraction) {
  const traceId = createTraceId();

  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply({ ephemeral: true });

  const events = (await getEvents(guildId))
    .filter(e => EVENT_TYPES_WITH_PARTICIPANTS.includes(e.eventType));

  if (!events.length) {
    await interaction.editReply({
      content: "No participant lists available for Custom/Reservoir events."
    });

    logger.emit({
      scope: "events.show_all",
      event: "no_participant_lists",
      traceId,
      context: { guildId },
    });

    return;
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

  logger.emit({
    scope: "events.show_all",
    event: "show_all_lists",
    traceId,
    context: {
      guildId,
      eventsCount: events.length,
      chunks: chunks.length,
    },
  });
}