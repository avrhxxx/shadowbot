// src/quickadd/integrations/QuickAddChannelService.ts

import { Guild, TextChannel } from "discord.js";

const CHANNEL_NAME = "quick-add";

export async function ensureQuickAddChannel(
  guild: Guild
): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (c) => c.name === CHANNEL_NAME && c.isTextBased()
  ) as TextChannel | undefined;

  if (existing) return existing;

  const channel = await guild.channels.create({
    name: CHANNEL_NAME,
    type: 0,
  });

  await channel.send("🧠 QuickAdd channel ready.\nUse `/quickadd start` to begin.");

  return channel;
}

export function isQuickAddChannel(channelId: string, quickAddChannelId: string) {
  return channelId === quickAddChannelId;
}