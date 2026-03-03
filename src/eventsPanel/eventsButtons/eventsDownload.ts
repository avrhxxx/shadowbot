// src/eventsPanel/eventsButtons/eventsDownload.ts
import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import fs from "fs";
import path from "path";
import { EventObject } from "../eventStorage";

/**
 * Globalny download – wszystkie eventy lub pojedynczy event
 * singleEventId – jeśli podany, generuje plik tylko dla tego eventu
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId;
  if (!guildId) return;

  const allEvents: EventObject[] = await EventStorage.getEvents(guildId);

  // Jeżeli przekazano singleEventId, filtrujemy tylko ten event
  const events: EventObject[] = singleEventId
    ? allEvents.filter(e => e.id === singleEventId)
    : allEvents;

  if (!events.length) {
    await interaction.reply({ content: "No events to download.", flags: 64 });
    return;
  }

  const config: { downloadChannelId?: string } = await EventStorage.getConfig(guildId);

  if (!config.downloadChannelId) {
    await interaction.reply({ content: "Download channel not set. Please configure it first.", flags: 64 });
    return;
  }

  const files: AttachmentBuilder[] = [];
  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  for (const event of events) {
    const statusLabel =
      event.status === "PAST"
        ? "[PAST]"
        : event.status === "CANCELED"
        ? "[CANCELED]"
        : "[ACTIVE]";

    const participants = event.participants.length
      ? event.participants.map(id => `<@${id}>`).join("\n")
      : "None";

    const absent = (event as any).absent?.length
      ? (event as any).absent.map((id: string) => `<@${id}>`).join("\n")
      : "None";

    const content = [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${event.day}/${event.month} ${event.hour}:${event.minute}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

    const filePath = path.join(tempDir, `${event.id}.txt`);
    fs.writeFileSync(filePath, content);
    files.push(new AttachmentBuilder(filePath));
  }

  const channel = interaction.guild!.channels.cache.get(config.downloadChannelId) as TextChannel | undefined;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel not found or not text-based.", flags: 64 });
    return;
  }

  await channel.send({ files });

  if (singleEventId) {
    await interaction.reply({
      content: `Participant file for event <#${singleEventId}> sent to <#${config.downloadChannelId}>.`,
      flags: 64
    });
  } else {
    await interaction.reply({
      content: `Participant files for all events sent to <#${config.downloadChannelId}>.`,
      flags: 64
    });
  }
}