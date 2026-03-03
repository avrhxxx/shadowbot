import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import path from "path";
import fs from "fs";
import { EventObject } from "../eventService";

/**
 * Download participant lists
 * singleEventId -> one event
 * otherwise -> all events in single file and message
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

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Jeśli pojedynczy event
  if (singleEventId) {
    const event = allEvents.find(e => e.id === singleEventId);
    if (!event) {
      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    const statusLabel =
      event.status === "PAST"
        ? "[PAST]"
        : event.status === "CANCELED"
        ? "[CANCELED]"
        : "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)}`;

    const messageContent = [
      `**Event:** ${event.name}`,
      `**Status:** ${statusLabel}`,
      `**Date:** ${dateStr}`,
      `**Participants:**\n${participants}`,
      `**Absent:**\n${absent}`,
      `\nYou can also download this as a TXT file attached below.`
    ].join("\n\n");

    const filePath = path.join(tempDir, `${event.id}.txt`);
    fs.writeFileSync(filePath, messageContent);

    const attachment = new AttachmentBuilder(filePath);

    await channel.send({ content: messageContent, files: [attachment] });

    await interaction.reply({
      content: `Participant file for event **${event.name}** sent to <#${config.downloadChannelId}>.`,
      ephemeral: true
    });

    return;
  }

  // Wszystkie eventy -> jeden plik i jedna wiadomość
  if (!allEvents.length) {
    await interaction.reply({ content: "No events to download.", ephemeral: true });
    return;
  }

  let fullMessage: string[] = [];
  allEvents.forEach(event => {
    const statusLabel =
      event.status === "PAST"
        ? "[PAST]"
        : event.status === "CANCELED"
        ? "[CANCELED]"
        : "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)}`;

    const eventText = [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${dateStr}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

    fullMessage.push(eventText);
  });

  const finalMessage = fullMessage.join("\n\n====================\n\n");

  const filePath = path.join(tempDir, `all_events_${Date.now()}.txt`);
  fs.writeFileSync(filePath, finalMessage);

  const attachment = new AttachmentBuilder(filePath);

  await channel.send({
    content: `Participant lists for all events:\n\n${finalMessage}\n\nYou can also download this as a TXT file attached below.`,
    files: [attachment]
  });

  await interaction.reply({
    content: `Participant lists for all events sent to <#${config.downloadChannelId}>.`,
    ephemeral: true
  });
}