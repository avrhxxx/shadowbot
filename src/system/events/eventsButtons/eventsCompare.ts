// =====================================
// 📁 src/system/events/eventsButtons/eventsCompare.ts
// =====================================

import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  TextChannel,
  AttachmentBuilder
} from "discord.js";
import { EventObject, getEvents, getConfig } from "../eventService";
import { formatEventUTC } from "../../../shared/utils/timeUtils";
import { logger } from "../../../core/logger/log";

function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
}

function getMemberName(guild: Guild, id: string) {
  const member = guild.members.cache.get(id);
  return member ? member.displayName : id;
}

async function sendComparisonFile(channel: TextChannel, name: string, content: string) {
  const file = new AttachmentBuilder(Buffer.from(content, "utf-8"), { name });
  await channel.send({ content: `📥 ${name}`, files: [file] });
}

// -----------------------------
// HELPER
// -----------------------------
async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find(e => e.id.toString().trim() === eventId.toString().trim()) || null;
}

// -----------------------------
// BUTTON HANDLERS
// -----------------------------
export const handleCompareButton = async (
  interaction: ButtonInteraction,
  eventId: string,
  traceId: string
): Promise<void> => {
  try {
    const guild = interaction.guild as Guild;
    const current = await getEventById(interaction.guildId!, eventId);

    if (!current) {
      logger.emit({ scope: "events.compare", event: "event_not_found", traceId, context: { eventId } });
      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    if (current.status !== "PAST") {
      await interaction.reply({ content: "You can only compare past events.", ephemeral: true });

      logger.emit({ scope: "events.compare", event: "not_past_event", traceId, context: { eventId } });
      return;
    }

    const events = await getEvents(interaction.guildId!);
    const pastEvents = events
      .filter(e =>
        e.status === "PAST" &&
        e.id !== current.id &&
        ["custom", "reservoir_raid"].includes(e.eventType)
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    if (!pastEvents.length) {
      await interaction.reply({ content: "No other past events available to compare.", ephemeral: true });

      logger.emit({ scope: "events.compare", event: "no_compare_candidates", traceId, context: { eventId } });
      return;
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId(`compare_select_${current.id}`)
      .setPlaceholder("Select event to compare with")
      .addOptions(
        pastEvents.map(ev =>
          new StringSelectMenuOptionBuilder()
            .setLabel(ev.name)
            .setDescription(formatEventUTCObj(ev))
            .setValue(ev.id)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    await interaction.reply({
      content: `Select event to compare with **${current.name}**`,
      components: [row],
      ephemeral: true
    });

    logger.emit({
      scope: "events.compare",
      event: "open_select",
      traceId,
      context: { baseEventId: current.id, candidates: pastEvents.length },
    });

  } catch (err) {
    logger.emit({ scope: "events.compare", event: "compare_button_failed", traceId, level: "error", error: err });
  }
};

export const handleCompareSelect = async (
  interaction: StringSelectMenuInteraction,
  traceId: string
): Promise<void> => {
  try {
    const guild = interaction.guild as Guild;
    const selectedId = interaction.values[0];
    const currentId = interaction.customId.replace("compare_select_", "");

    const eventA = await getEventById(guild.id, currentId);
    const eventB = await getEventById(guild.id, selectedId);

    if (!eventA || !eventB) {
      await interaction.update({ content: "One of the events no longer exists.", components: [] });

      logger.emit({
        scope: "events.compare",
        event: "select_event_missing",
        traceId,
        context: { currentId, selectedId },
      });
      return;
    }

    const { embedText } = buildComparisonAB(eventA, eventB, guild);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`compare_download_${eventA.id}_${eventB.id}`)
        .setLabel("Download")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({ content: embedText, components: [row] });

    logger.emit({
      scope: "events.compare",
      event: "comparison_ready",
      traceId,
      context: { eventA: eventA.id, eventB: eventB.id },
    });

  } catch (err) {
    logger.emit({ scope: "events.compare", event: "compare_select_failed", traceId, level: "error", error: err });
  }
};

export const handleCompareDownload = async (
  interaction: ButtonInteraction,
  traceId: string
): Promise<void> => {
  try {
    const guild = interaction.guild as Guild;
    const [, , idA, idB] = interaction.customId.split("_");

    const eventA = await getEventById(guild.id, idA);
    const eventB = await getEventById(guild.id, idB);

    if (!eventA || !eventB) {
      await interaction.reply({ content: "Events not found.", ephemeral: true });

      logger.emit({
        scope: "events.compare",
        event: "download_events_missing",
        traceId,
        context: { idA, idB },
      });
      return;
    }

    const { txtText } = buildComparisonAB(eventA, eventB, guild);
    const config = await getConfig(guild.id);

    const channelId = config?.downloadChannel;
    if (!channelId) {
      await interaction.reply({ content: "Download channel not set.", ephemeral: true });

      logger.emit({
        scope: "events.compare",
        event: "missing_download_channel",
        traceId,
        context: { guildId: guild.id },
      });
      return;
    }

    const channel = guild.channels.cache.get(channelId) as TextChannel;
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({ content: "Download channel invalid.", ephemeral: true });

      logger.emit({
        scope: "events.compare",
        event: "invalid_download_channel",
        traceId,
        context: { channelId },
      });
      return;
    }

    await sendComparisonFile(channel, `compare_${eventA.name}_vs_${eventB.name}.txt`, txtText);

    await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });

    logger.emit({
      scope: "events.compare",
      event: "download_sent",
      traceId,
      context: { eventA: eventA.id, eventB: eventB.id, channelId },
    });

  } catch (err) {
    logger.emit({ scope: "events.compare", event: "download_failed", traceId, level: "error", error: err });
  }
};

// -----------------------------
// Compare All
// -----------------------------
export const handleCompareAll = async (
  interaction: ButtonInteraction,
  traceId: string
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  try {
    const events = await getEvents(interaction.guildId!);
    const relevantEvents = events.filter(e => ["custom", "reservoir_raid"].includes(e.eventType));

    if (!relevantEvents.length) {
      await interaction.editReply({ content: "No events with participants to compare.", components: [] });

      logger.emit({ scope: "events.compare", event: "compare_all_empty", traceId });
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("compare_all_download")
        .setLabel("Download All (TXT)")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({
      content: `📥 Comparison ready.`,
      components: [row]
    });

    logger.emit({
      scope: "events.compare",
      event: "compare_all_ready",
      traceId,
      context: { eventsCount: relevantEvents.length },
    });

  } catch (err) {
    logger.emit({ scope: "events.compare", event: "compare_all_failed", traceId, level: "error", error: err });
  }
};

export const handleCompareAllDownload = async (
  interaction: ButtonInteraction,
  traceId: string
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  try {
    const events = await getEvents(interaction.guildId!);
    const relevantEvents = events.filter(e => ["custom", "reservoir_raid"].includes(e.eventType));

    if (!relevantEvents.length) {
      await interaction.editReply({ content: "No events to download.", components: [] });

      logger.emit({ scope: "events.compare", event: "compare_all_download_empty", traceId });
      return;
    }

    const { txtText } = buildComparisonAll(relevantEvents, interaction.guild as Guild);
    const config = await getConfig(interaction.guildId!);

    if (!config?.downloadChannel) {
      await interaction.editReply({ content: "Download channel not set.", components: [] });

      logger.emit({ scope: "events.compare", event: "compare_all_missing_channel", traceId });
      return;
    }

    const channel = interaction.guild!.channels.cache.get(config.downloadChannel) as TextChannel;

    const chunks = txtText.match(/[\s\S]{1,1900}/g) || [];

    for (const [i, chunk] of chunks.entries()) {
      await sendComparisonFile(channel, `compare_all_part_${i + 1}.txt`, chunk);
    }

    await interaction.editReply({
      content: `Comparison sent to <#${config.downloadChannel}>`,
      components: []
    });

    logger.emit({
      scope: "events.compare",
      event: "compare_all_sent",
      traceId,
      context: { parts: chunks.length },
    });

  } catch (err) {
    logger.emit({ scope: "events.compare", event: "compare_all_download_failed", traceId, level: "error", error: err });
  }
};