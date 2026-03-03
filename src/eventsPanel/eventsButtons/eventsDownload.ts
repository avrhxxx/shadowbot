import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import fs from "fs";
import path from "path";
import { EventObject } from "../eventStorage";

export async function handleDownload(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId;
  if (!guildId) return;

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const config: { defaultChannelId?: string; downloadChannelId?: string } = await EventStorage.getConfig(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events to download.", flags: 64 });
    return;
  }

  const files: AttachmentBuilder[] = [];
  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  for (const event of events) {
    const statusLabel = event.status === "PAST" ? "[PAST]" : event.status === "CANCELED" ? "[CANCELED]" : "[ACTIVE]";
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

  // Wyślij pliki do kanału downloadChannelId jeśli ustawione
  const targetChannelId = config.downloadChannelId || config.defaultChannelId;
  if (!targetChannelId) {
    await interaction.reply({ content: "No channel set for downloads.", flags: 64 });
    return;
  }

  const channel = interaction.guild!.channels.cache.get(targetChannelId) as TextChannel | undefined;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Target channel not found or not text-based.", flags: 64 });
    return;
  }

  await channel.send({ files });
  await interaction.reply({ content: `Participants files sent to <#${targetChannelId}>.`, flags: 64 });
}