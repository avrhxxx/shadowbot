import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import fs from "fs";
import path from "path";

export async function handleDownload(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);
  const pastEvents = events.filter(e => e.status === "PAST");
  const config = await EventStorage.getConfig(guildId);

  if (!pastEvents.length) {
    await interaction.reply({ content: "No past events to download.", ephemeral: true });
    return;
  }

  const files: AttachmentBuilder[] = [];
  const tempDir = path.join(__dirname, "../../temp");

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  for (const event of pastEvents) {
    const content = [
      `Event: ${event.name}`,
      `Date: ${event.day}/${event.month}`,
      `Participants:`,
      ...event.participants
    ].join("\n");

    const filePath = path.join(tempDir, `${event.id}.txt`);
    fs.writeFileSync(filePath, content);
    files.push(new AttachmentBuilder(filePath));
  }

  const channel = interaction.guild!.channels.cache.get(config.defaultChannelId) as TextChannel | undefined;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Default channel not found or not text-based.", ephemeral: true });
    return;
  }

  await channel.send({ files });
  await interaction.reply({ content: "Participants files sent.", ephemeral: true });
}