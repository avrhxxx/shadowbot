import { Interaction, AttachmentBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import fs from "fs";
import path from "path";

export async function handleDownload(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const events = await EventStorage.getEvents(interaction.guildId!);
  const pastEvents = events.filter(e => e.status === "PAST");
  const config = await EventStorage.getConfig(interaction.guildId!);

  if (!pastEvents.length) {
    await interaction.reply({ content: "No past events to download.", ephemeral: true });
    return;
  }

  const files: AttachmentBuilder[] = [];

  for (const event of pastEvents) {
    const content = [
      `Event: ${event.name}`,
      `Date: ${event.day}/${event.month}`,
      `Participants:`,
      ...event.participants
    ].join("\n");

    const filePath = path.join(__dirname, `../../temp/${event.id}.txt`);
    fs.writeFileSync(filePath, content);
    files.push(new AttachmentBuilder(filePath));
  }

  const channel = interaction.guild!.channels.cache.get(config.defaultChannelId);
  if (channel?.isTextBased()) await channel.send({ files });

  await interaction.reply({ content: "Participants files sent.", ephemeral: true });
}
