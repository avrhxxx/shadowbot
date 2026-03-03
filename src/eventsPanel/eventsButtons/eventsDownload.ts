import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import path from "path";
import fs from "fs";
import { EventObject } from "../eventService";

/**
 * Download plików z uczestnikami
 * Jeżeli przekazany eventId -> tylko dla jednego eventu
 * Jeżeli brak eventId -> globalny download wszystkich eventów
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId;
  if (!guildId) return;

  const allEvents: EventObject[] = await EventStorage.getEvents(guildId);

  // Filtrujemy jeśli podano singleEventId
  const events: EventObject[] = singleEventId
    ? allEvents.filter(e => e.id === singleEventId)
    : allEvents;

  if (!events.length) {
    await interaction.reply({ content: "No events to download.", ephemeral: true });
    return;
  }

  const config: { downloadChannelId?: string } = await EventStorage.getConfig(guildId);

  // **Wymagany kanał do downloadu**
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

  const files: AttachmentBuilder[] = [];

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

    const absent = event.absent?.length
      ? event.absent.map(id => `<@${id}>`).join("\n")
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

  await channel.send({ files });

  await interaction.reply({
    content: singleEventId
      ? `Participant file for event **${singleEventId}** sent to <#${config.downloadChannelId}>.`
      : `Participant files for all events sent to <#${config.downloadChannelId}>.`,
    ephemeral: true
  });
}