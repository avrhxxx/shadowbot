// src/eventsPanel/eventsButtons/eventsDownload.ts
import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import { getEvents, getConfig } from "../eventService";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

/**
 * Download participant lists
 * - singleEventId -> one event
 * - otherwise -> all events in TXT file(s)
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.guild || !interaction.guildId) return;

  const guildId = interaction.guildId;
  const allEvents: EventObject[] = await getEvents(guildId);
  const config = await getConfig(guildId);

  // 🔹 Bezpieczne sprawdzenie configu
  if (!config || !config.downloadChannelId || config.downloadChannelId.trim() === "") {
    await interaction.reply({
      content: "❌ Download channel is not set in event settings.",
      ephemeral: true
    });
    return;
  }

  const channel = interaction.guild.channels.cache.get(config.downloadChannelId);

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: "❌ Download channel not found or is not a text channel.",
      ephemeral: true
    });
    return;
  }

  // 🔹 Single event download
  if (singleEventId) {
    const event = allEvents.find(e => e.id === singleEventId);
    if (!event) {
      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    const statusLabel =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

    const messageContent = [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${dateStr}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

    const file = new AttachmentBuilder(
      Buffer.from(messageContent, "utf-8"),
      { name: `${event.id}.txt` }
    );

    await channel.send({
      content: `Participant list for **${event.name}**`,
      files: [file]
    });

    await interaction.reply({
      content: `✅ Participant file sent to <#${config.downloadChannelId}>.`,
      ephemeral: true
    });

    return;
  }

  // 🔹 Download all events
  await interaction.deferReply({ ephemeral: true });

  if (!allEvents.length) {
    await interaction.editReply({ content: "No events to download.", components: [] });
    return;
  }

  const finalMessage: string[] = allEvents.map(event => {
    const statusLabel =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

    return [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${dateStr}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");
  });

  const fileName = `all_events_${Date.now()}.txt`;

  const file = new AttachmentBuilder(
    Buffer.from(finalMessage.join("\n\n====================\n\n"), "utf-8"),
    { name: fileName }
  );

  await channel.send({
    content: "All participant lists",
    files: [file]
  });

  await interaction.editReply({
    content: `✅ Participant lists sent to <#${config.downloadChannelId}>.`,
    components: []
  });
}