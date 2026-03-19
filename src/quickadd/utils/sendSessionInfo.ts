// src/quickadd/session/sendSessionInfo.ts

import { TextChannel, EmbedBuilder } from "discord.js";

export async function sendSessionInfo(
  channel: TextChannel,
  moderatorId: string,
  mode: "add" | "attend"
) {
  const embed = new EmbedBuilder()
    .setTitle("Quick Add")
    .setDescription(
      `Send a screenshot or type data to add entries.\n\n` +

      `**Auto-detection**\n` +
      `donations • duel points • raid • attendance\n\n` +

      `**Examples**\n` +
      `Nick 3000\n` +
      `Nick 36.5M\n` +
      `Nick\n\n` +

      `If detection fails, try another screenshot or enter the data manually.\n\n` +

      `\`!preview\` • \`!help\``
    )
    .setColor(0x5865f2);

  await channel.send({ embeds: [embed] });
}