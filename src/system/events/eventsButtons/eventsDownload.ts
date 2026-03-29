// =====================================
// 📁 src/system/events/eventsButtons/eventsDownload.ts
// =====================================

import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import { getEvents, getConfig, EventObject } from "../eventService";
import { formatEventUTC } from "../../../shared/utils/timeUtils";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// -----------------------------
// HELPERS
// -----------------------------
function formatStatus(event: EventObject): string {
  if (event.status === "PAST") return "[PAST]";
  if (event.status === "CANCELED") return "[CANCELED]";
  return "[ACTIVE]";
}

function buildEventContent(event: EventObject): string {
  const participants = event.participants.length
    ? event.participants.join("\n")
    : "None";

  const absent = event.absent?.length
    ? event.absent.join("\n")
    : "None";

  const date = formatEventUTC(
    event.day,
    event.month,
    event.hour,
    event.minute,
    event.year
  );

  return [
    `Event: ${event.name}`,
    `Status: ${formatStatus(event)}`,
    `Date: ${date}`,
    `Participants:\n${participants}`,
    `Absent:\n${absent}`
  ].join("\n\n");
}

async function getEventById(
  guildId: string,
  eventId: string
): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find(e => e.id.toString().trim() === eventId.toString().trim()) || null;
}

// -----------------------------
// MAIN HANDLER
// -----------------------------
export async function handleDownload(
  interaction: ButtonInteraction,
  singleEventId?: string
) {
  const traceId = createTraceId();

  if (!interaction.guild || !interaction.guildId) {
    logger.emit({
      scope: "events.download",
      event: "missing_guild",
      traceId,
      level: "error",
    });
    return;
  }

  const guildId = interaction.guildId;

  try {
    const [allEvents, config] = await Promise.all([
      getEvents(guildId),
      getConfig(guildId)
    ]);

    if (!config || !config.downloadChannel) {
      await interaction.reply({
        content: "❌ Download channel is not set in event settings.",
        ephemeral: true
      });

      logger.emit({
        scope: "events.download",
        event: "missing_channel_config",
        traceId,
        context: { guildId }
      });

      return;
    }

    const channel = interaction.guild.channels.cache.get(config.downloadChannel);

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        content: "❌ Download channel not found or not a text channel.",
        ephemeral: true
      });

      logger.emit({
        scope: "events.download",
        event: "invalid_channel",
        traceId,
        context: { guildId, channelId: config.downloadChannel }
      });

      return;
    }

    const textChannel = channel as TextChannel;

    // -------------------------
    // SINGLE EVENT
    // -------------------------
    if (singleEventId) {
      const event = await getEventById(guildId, singleEventId);

      if (!event) {
        await interaction.reply({
          content: "Event not found.",
          ephemeral: true
        });

        logger.emit({
          scope: "events.download",
          event: "event_not_found",
          traceId,
          context: { guildId, eventId: singleEventId }
        });

        return;
      }

      if (!["custom", "reservoir_raid"].includes(event.eventType)) {
        await interaction.reply({
          content: "❌ This event type cannot be downloaded.",
          ephemeral: true
        });

        logger.emit({
          scope: "events.download",
          event: "invalid_event_type",
          traceId,
          context: { eventType: event.eventType }
        });

        return;
      }

      const content = buildEventContent(event);

      const file = new AttachmentBuilder(
        Buffer.from(content, "utf8"),
        { name: `${event.id}.txt` }
      );

      await textChannel.send({
        content: `Participant list for **${event.name}**`,
        files: [file]
      });

      await interaction.reply({
        content: `Participant file sent to <#${config.downloadChannel}>.`,
        ephemeral: true
      });

      logger.emit({
        scope: "events.download",
        event: "single_download_success",
        traceId,
        context: { guildId, eventId: event.id }
      });

      return;
    }

    // -------------------------
    // ALL EVENTS
    // -------------------------
    await interaction.deferReply({ ephemeral: true });

    const relevantEvents = allEvents.filter(e =>
      ["custom", "reservoir_raid"].includes(e.eventType)
    );

    if (!relevantEvents.length) {
      await interaction.editReply({
        content: "No events with participants to download.",
        components: []
      });

      logger.emit({
        scope: "events.download",
        event: "no_events",
        traceId,
        context: { guildId }
      });

      return;
    }

    const blocks = relevantEvents.map(buildEventContent);

    const fullText = blocks.join("\n\n====================\n\n");

    const chunks = fullText.match(/[\s\S]{1,1900000}/g) || [];

    for (const [i, chunk] of chunks.entries()) {
      const file = new AttachmentBuilder(
        Buffer.from(chunk, "utf8"),
        { name: `all_events_part_${i + 1}.txt` }
      );

      await textChannel.send({
        content: `All participant lists (part ${i + 1})`,
        files: [file]
      });
    }

    await interaction.editReply({
      content: `Participant lists sent to <#${config.downloadChannel}>.`,
      components: []
    });

    logger.emit({
      scope: "events.download",
      event: "bulk_download_success",
      traceId,
      context: {
        guildId,
        eventsCount: relevantEvents.length,
        chunks: chunks.length
      }
    });

  } catch (error) {
    logger.emit({
      scope: "events.download",
      event: "download_failed",
      traceId,
      level: "error",
      error
    });

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "❌ Failed to download events.",
          components: []
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to download events.",
          ephemeral: true
        });
      }
    } catch {
      // silent fail
    }
  }
}