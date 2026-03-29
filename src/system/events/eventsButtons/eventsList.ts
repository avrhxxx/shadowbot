// =====================================
// 📁 src/system/events/eventsButtons/eventsList.ts
// =====================================

import { 
  ButtonInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Message 
} from "discord.js";
import { getEvents, EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// -----------------------------
// STATUS COLORS
// -----------------------------
const STATUS_COLORS: Record<string, number> = {
  ACTIVE: 0x00ff00,
  PAST: 0x808080,
  CANCELED: 0xff0000
};

// -----------------------------
// EVENT TYPES
// -----------------------------
const PARTICIPANT_EVENTS = ["reservoir_raid", "custom"];

// -----------------------------
// HELPERS
// -----------------------------
function cleanNickname(nick: string) {
  return nick.replace(/<@!?[0-9]+>/g, "").trim();
}

function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(
    e.day,
    e.month,
    e.hour,
    e.minute,
    e.year ?? new Date().getUTCFullYear()
  );
}

function formatCategoryLabel(label: string) {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// -----------------------------
// CREATE EVENT EMBED + BUTTONS
// -----------------------------
function createEventEmbedAndRows(event: EventObject) {

  const showParticipants = PARTICIPANT_EVENTS.includes(event.eventType);

  const eventDate = new Date(
    Date.UTC(
      event.year ?? new Date().getUTCFullYear(),
      event.month - 1,
      event.day,
      event.hour,
      event.minute
    )
  );

  const unix = Math.floor(eventDate.getTime() / 1000);

  let description =
`Status: ${event.status}
Date: ${formatEventUTCObj(event)}
Starts: <t:${unix}:R>`;

  if (showParticipants) {
    description += `

Participants: ${event.participants.length}`;

    if (event.absent?.length) {
      description += `\nAbsent: ${event.absent.length}`;
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(event.name)
    .setDescription(description)
    .setColor(STATUS_COLORS[event.status] ?? 0xffffff);

  const clearButton = new ButtonBuilder()
    .setCustomId(`event_clear_${event.id}`)
    .setLabel("Clear Event Data")
    .setStyle(ButtonStyle.Danger);

  if (!showParticipants) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(clearButton);

    return { embed, rows: [row] };
  }

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(

    new ButtonBuilder()
      .setCustomId(`event_add_${event.id}`)
      .setLabel("Add Participant")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`event_remove_${event.id}`)
      .setLabel("Remove Participant")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`event_absent_${event.id}`)
      .setLabel("Mark Absent")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`event_show_list_${event.id}`)
      .setLabel("Show List")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`event_download_single_${event.id}`)
      .setLabel("Download")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(

    new ButtonBuilder()
      .setCustomId(`event_compare_${event.id}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Secondary),

    clearButton
  );

  return { embed, rows: [row1, row2] };
}

// -----------------------------
// CATEGORY CLICK
// -----------------------------
export async function handleCategoryClick(interaction: ButtonInteraction, category?: string) {

  const traceId = createTraceId();

  if (category) return await handleListByCategory(interaction, category);

  const guildId = interaction.guildId!;
  try {
    const events = await getEvents(guildId);

    if (!events.length) {
      await interaction.reply({ content: "No events found.", ephemeral: true });
      return;
    }

    const categories = Array.from(new Set(events.map(e => e.eventType || "custom")));

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();

    categories.forEach((cat, idx) => {

      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`event_category_${cat}`)
          .setLabel(formatCategoryLabel(cat))
          .setStyle(ButtonStyle.Primary)
      );

      if ((idx + 1) % 5 === 0) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
      }
    });

    if (currentRow.components.length > 0) rows.push(currentRow);

    await interaction.reply({
      content: "Select a category to view events:",
      components: rows,
      ephemeral: true
    });

    logger.emit({
      scope: "events.list",
      event: "categories_shown",
      traceId,
      context: { guildId, categories: categories.length }
    });

  } catch (error) {
    logger.emit({
      scope: "events.list",
      event: "category_click_failed",
      traceId,
      level: "error",
      error
    });

    await interaction.reply({
      content: "❌ Failed to load categories.",
      ephemeral: true
    }).catch(() => null);
  }
}

// -----------------------------
// LIST BY CATEGORY
// -----------------------------
export async function handleListByCategory(interaction: ButtonInteraction, category?: string) {

  const traceId = createTraceId();
  const guildId = interaction.guildId!;

  try {
    const events = await getEvents(guildId);

    if (!events.length) {
      await interaction.reply({ content: "No events found.", ephemeral: true });
      return;
    }

    const filteredEvents = category
      ? events.filter(e => e.eventType === category)
      : events;

    if (!filteredEvents.length) {
      await interaction.reply({
        content: `No events found for category "${category}".`,
        ephemeral: true
      });
      return;
    }

    for (let i = 0; i < filteredEvents.length; i++) {

      const event = filteredEvents[i];
      const { embed, rows } = createEventEmbedAndRows(event);

      const payload = { embeds: [embed], components: rows, ephemeral: true };

      if (i === 0) await interaction.reply(payload);
      else await interaction.followUp(payload);
    }

    logger.emit({
      scope: "events.list",
      event: "category_list_shown",
      traceId,
      context: { guildId, category, count: filteredEvents.length }
    });

  } catch (error) {
    logger.emit({
      scope: "events.list",
      event: "list_by_category_failed",
      traceId,
      level: "error",
      error
    });

    await interaction.reply({
      content: "❌ Failed to load events.",
      ephemeral: true
    }).catch(() => null);
  }
}

// -----------------------------
// SHOW LIST
// -----------------------------
export async function handleShowList(interaction: ButtonInteraction, eventId: string) {

  const traceId = createTraceId();
  const guildId = interaction.guildId!;

  try {
    const events = await getEvents(guildId);
    const event = events.find(e => e.id.toString() === eventId);

    if (!event) {
      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    const participants = event.participants.map(cleanNickname);
    const absent = event.absent?.map(cleanNickname) || [];

    const embed = new EmbedBuilder()
      .setTitle(`List for ${event.name}`)
      .setDescription(
        `Date: ${formatEventUTCObj(event)}

Participants (${participants.length}):
${participants.join("\n")}` +
        (absent.length ? `

Absent (${absent.length}):
${absent.join("\n")}` : "")
      )
      .setColor(STATUS_COLORS[event.status] ?? 0xffffff);

    await interaction.reply({ embeds: [embed], ephemeral: true });

    logger.emit({
      scope: "events.list",
      event: "show_list",
      traceId,
      context: { guildId, eventId }
    });

  } catch (error) {
    logger.emit({
      scope: "events.list",
      event: "show_list_failed",
      traceId,
      level: "error",
      error
    });

    await interaction.reply({
      content: "❌ Failed to load list.",
      ephemeral: true
    }).catch(() => null);
  }
}

// -----------------------------
// UPDATE EMBED
// -----------------------------
export async function updateEventEmbed(message: Message, eventId: string) {

  const traceId = createTraceId();
  const guildId = message.guildId;
  if (!guildId) return;

  try {
    const events = await getEvents(guildId);
    const event = events.find(ev => ev.id.toString() === eventId);

    if (!event) return;

    const { embed, rows } = createEventEmbedAndRows(event);

    await message.edit({ embeds: [embed], components: rows });

    logger.emit({
      scope: "events.list",
      event: "embed_updated",
      traceId,
      context: { guildId, eventId }
    });

  } catch (error) {
    logger.emit({
      scope: "events.list",
      event: "embed_update_failed",
      traceId,
      level: "error",
      error
    });
  }
}