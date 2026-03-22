// src/quickadd/services/QuickAddChannelService.ts

import {
  Guild,
  TextChannel,
  ChannelType,
  EmbedBuilder,
} from "discord.js";

export async function createQuickAddChannel(
  guild: Guild
): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === "quick-add"
  ) as TextChannel | undefined;

  if (existing) {
    await ensureInfoMessage(existing);
    return existing;
  }

  const channel = await guild.channels.create({
    name: "quick-add",
    type: ChannelType.GuildText,
  });

  await sendQuickAddInfo(channel);

  return channel;
}

// 📩 EMBED (UPDATED)
async function sendQuickAddInfo(channel: TextChannel) {
  const embed = new EmbedBuilder()
    .setTitle("Quick Add")
    .setDescription(
      `Start a session with \`!start\`.\n\n` +

      `A private session channel will be created where you can send screenshots or type data.\n\n` +

      `**Supported data**\n` +
      `donations • duel points • raid • attendance\n\n` +

      `\`!help\``
    )
    .setColor(0x5865f2);

  const msg = await channel.send({ embeds: [embed] });

  await msg.pin().catch(() => {});
}

// 🔒 żeby nie spamować embedów
async function ensureInfoMessage(channel: TextChannel) {
  try {
    const messages = await channel.messages.fetch({ limit: 10 });

    const hasEmbed = messages.some(
      (msg) =>
        msg.author.bot &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title?.includes("Quick Add")
    );

    if (!hasEmbed) {
      await sendQuickAddInfo(channel);
    }
  } catch (err) {
    console.error("QuickAdd ensureInfoMessage error:", err);
  }
}