// src/eventsPanel/eventsButtons/eventsDownload.ts
import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import path from "path";
import fs from "fs";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { fragmentText } from "../../helpers/heavyTaskHelper";

/**
 * Download participant lists
 * - singleEventId -> one event
 * - otherwise -> all events with fragmentation for large data
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.isButton()) return;
  const guildId = interaction.guildId;
  if (!guildId) return;

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

  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  // 🔹 Single event download (bez heavy task switch)
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
      `**Event:** ${event.name}`,
      `**Status:** ${statusLabel}`,
      `**Date:** ${dateStr}`,
      `**Participants:**\n${participants}`,
      `**Absent:**\n${absent}`
    ].join("\n\n");

    const filePath = path.join(tempDir, `${event.id}.txt`);
    fs.writeFileSync(filePath, messageContent);

    const attachment = new AttachmentBuilder(filePath);

    await channel.send({
      content: `${messageContent}\n\nYou can also download this as a TXT file attached below.`,
      files: [attachment]
    });

    await interaction.reply({
      content: `Participant file for event **${event.name}** sent to <#${config.downloadChannelId}>.`,
      ephemeral: true
    });

    return;
  }

  // 🔹 Download all events (Heavy Task Switch + fragmentation)
  await interaction.deferReply({ ephemeral: true });

  if (!allEvents.length) {
    await interaction.editReply({ content: "No events to download.", components: [] });
    return;
  }

  const fullMessage: string[] = allEvents.map(event => {
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

  const finalMessage = fullMessage.join("\n\n====================\n\n");

  // 🔹 fragmentujemy jeśli wiadomość jest za duża
  const fragments = fragmentText(finalMessage, 1900); // Discord max 2000 znaków w wiadomości

  for (let i = 0; i < fragments.length; i++) {
    const fragmentFilePath = path.join(tempDir, `all_events_part_${i + 1}_${Date.now()}.txt`);
    fs.writeFileSync(fragmentFilePath, fragments[i]);

    const attachment = new AttachmentBuilder(fragmentFilePath);

    await channel.send({
      content: `Participant lists for all events — part ${i + 1}:\n\n${fragments[i]}\n\nYou can also download this as a TXT file attached below.`,
      files: [attachment]
    });
  }

  await interaction.editReply({
    content: `Participant lists for all events sent to <#${config.downloadChannelId}> in ${fragments.length} parts.`,
    components: []
  });
}