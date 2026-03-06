import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

/**
 * Download participant lists
 * - singleEventId -> one event
 * - otherwise -> all events in single file and message
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.isButton()) return;
  const guildId = interaction.guildId!;
  const allEvents: EventObject[] = await EventStorage.getEvents(guildId);
  const config: { downloadChannelId?: string } = await EventStorage.getConfig(guildId);

  if (!config.downloadChannelId) {
    await interaction.reply({ content: "Download channel is not set.", ephemeral: true });
    return;
  }

  const channel = interaction.guild!.channels.cache.get(config.downloadChannelId) as TextChannel | undefined;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel not found or not text-based.", ephemeral: true });
    return;
  }

  // 🔹 Single event download
  if (singleEventId) {
    const event = allEvents.find(e => e.id === singleEventId);
    if (!event) return interaction.reply({ content: "Event not found.", ephemeral: true });

    const statusLabel =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

    const messageContent = [
      `**Event:** ${event.name}`,
      `**Status:** ${statusLabel}`,
      `**Date:** ${dateStr}`,
      `**Participants:**\n${participants}`,
      `**Absent:**\n${absent}`
    ].join("\n\n");

    const file = new AttachmentBuilder(Buffer.from(messageContent, "utf-8"), { name: `${event.id}.txt` });

    await channel.send({
      content: `${messageContent}\n\nYou can also download this as a TXT file attached below.`,
      files: [file]
    });

    await interaction.reply({
      content: `Participant file for event **${event.name}** sent to <#${config.downloadChannelId}>.`,
      ephemeral: true
    });

    return;
  }

  // 🔹 Download all events → always in file
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

  const file = new AttachmentBuilder(Buffer.from(finalMessage.join("\n\n====================\n\n"), "utf-8"), { name: `all_events_${Date.now()}.txt` });

  await channel.send({
    content: `Participant lists for all events:\n\nYou can also download this as a TXT file attached below.`,
    files: [file]
  });

  await interaction.editReply({ content: `Participant lists for all events sent to <#${config.downloadChannelId}>.`, components: [] });
}