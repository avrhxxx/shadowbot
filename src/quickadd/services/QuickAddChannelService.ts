import {
  Guild,
  TextChannel,
  ChannelType,
} from "discord.js";
import { sendQuickAddInfo } from "../embeds/QuickAddInfoEmbed";

export async function createQuickAddChannel(
  guild: Guild
): Promise<TextChannel> {
  // 🔍 sprawdzamy czy kanał już istnieje
  const existing = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === "quick-add"
  ) as TextChannel | undefined;

  if (existing) {
    // 🔥 jeśli kanał istnieje — upewnij się że ma embed
    await ensureInfoMessage(existing);
    return existing;
  }

  // 🏗️ tworzymy kanał
  const channel = await guild.channels.create({
    name: "quick-add",
    type: ChannelType.GuildText,
  });

  // 📩 wysyłamy embed startowy
  await sendQuickAddInfo(channel);

  return channel;
}

// 🔒 helper żeby nie spamować embedów
async function ensureInfoMessage(channel: TextChannel) {
  try {
    const messages = await channel.messages.fetch({ limit: 10 });

    const hasBotEmbed = messages.some(
      (msg) =>
        msg.author.bot &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title?.includes("Quick Add")
    );

    if (!hasBotEmbed) {
      await sendQuickAddInfo(channel);
    }
  } catch (err) {
    console.error("QuickAdd ensureInfoMessage error:", err);
  }
}