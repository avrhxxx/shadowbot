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
import { log } from "../../../core/logger/log";
import type { TraceContext } from "../../../core/trace/TraceContext";

// ======================================================
// HELPERS
// ======================================================
function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
}

async function sendComparisonFile(channel: TextChannel, name: string, content: string) {
  const file = new AttachmentBuilder(Buffer.from(content, "utf-8"), { name });
  await channel.send({ content: `📥 ${name}`, files: [file] });
}

async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  return events.find(e => e.id.toString().trim() === eventId.toString().trim()) || null;
}

// ======================================================
// BUTTON → SELECT
// ======================================================
export const handleCompareButton = async (
  interaction: ButtonInteraction,
  eventId: string,
  ctx: TraceContext
): Promise<void> => {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId;

  if (!guildId) {
    l.error("missing_guild", null);
    return;
  }

  try {
    const guild = interaction.guild as Guild;
    const current = await getEventById(guildId, eventId);

    if (!current) {
      l.warn("event_not_found", { guildId, eventId });

      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    if (current.status !== "PAST") {
      l.warn("not_past_event", { guildId, eventId });

      await interaction.reply({
        content: "You can only compare past events.",
        ephemeral: true
      });
      return;
    }

    const events = await getEvents(guildId);

    const pastEvents = events
      .filter(e =>
        e.status === "PAST" &&
        e.id !== current.id &&
        ["custom", "reservoir_raid"].includes(e.eventType)
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    if (!pastEvents.length) {
      l.warn("no_compare_candidates", { guildId, eventId });

      await interaction.reply({
        content: "No other past events available to compare.",
        ephemeral: true
      });
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

    l.event("open_select", {
      guildId,
      baseEventId: current.id,
      candidates: pastEvents.length,
    });

  } catch (err) {
    l.error("compare_button_failed", err);
  }
};

// ======================================================
// SELECT → RESULT
// ======================================================
export const handleCompareSelect = async (
  interaction: StringSelectMenuInteraction,
  ctx: TraceContext
): Promise<void> => {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId;

  if (!guildId) {
    l.error("missing_guild", null);
    return;
  }

  try {
    const guild = interaction.guild as Guild;

    const selectedId = interaction.values[0];
    const currentId = interaction.customId.replace("compare_select_", "");

    const eventA = await getEventById(guildId, currentId);
    const eventB = await getEventById(guildId, selectedId);

    if (!eventA || !eventB) {
      l.warn("select_event_missing", { guildId, currentId, selectedId });

      await interaction.update({
        content: "One of the events no longer exists.",
        components: []
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

    await interaction.update({
      content: embedText,
      components: [row]
    });

    l.event("comparison_ready", {
      guildId,
      eventA: eventA.id,
      eventB: eventB.id,
    });

  } catch (err) {
    l.error("compare_select_failed", err);
  }
};

// ======================================================
// DOWNLOAD SINGLE
// ======================================================
export const handleCompareDownload = async (
  interaction: ButtonInteraction,
  ctx: TraceContext
): Promise<void> => {
  const l = log.ctx(ctx);
  const guildId = interaction.guildId;

  if (!guildId) {
    l.error("missing_guild", null);
    return;
  }

  try {
    const guild = interaction.guild as Guild;
    const [, , idA, idB] = interaction.customId.split("_");

    const eventA = await getEventById(guildId, idA);
    const eventB = await getEventById(guildId, idB);

    if (!eventA || !eventB) {
      l.warn("download_events_missing", { guildId, idA, idB });

      await interaction.reply({ content: "Events not found.", ephemeral: true });
      return;
    }

    const { txtText } = buildComparisonAB(eventA, eventB, guild);
    const config = await getConfig(guildId);

    if (!config?.downloadChannel) {
      l.warn("missing_download_channel", { guildId });

      await interaction.reply({
        content: "Download channel not set.",
        ephemeral: true
      });
      return;
    }

    const channel = guild.channels.cache.get(config.downloadChannel) as TextChannel;

    if (!channel || !channel.isTextBased()) {
      l.warn("invalid_download_channel", { guildId, channelId: config.downloadChannel });

      await interaction.reply({
        content: "Download channel invalid.",
        ephemeral: true
      });
      return;
    }

    await sendComparisonFile(
      channel,
      `compare_${eventA.name}_vs_${eventB.name}.txt`,
      txtText
    );

    await interaction.reply({
      content: "Comparison sent to download channel.",
      ephemeral: true
    });

    l.event("download_sent", {
      guildId,
      eventA: eventA.id,
      eventB: eventB.id,
      channelId: config.downloadChannel,
    });

  } catch (err) {
    l.error("download_failed", err);
  }
};