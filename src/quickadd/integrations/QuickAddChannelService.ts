// =====================================
// 📁 src/quickadd/integrations/QuickAddChannelService.ts
// =====================================

import { Guild, TextChannel, ChannelType, EmbedBuilder } from "discord.js";

const CHANNEL_NAME = "quick-add";

export async function ensureQuickAddChannel(
  guild: Guild
): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === CHANNEL_NAME
  ) as TextChannel | undefined;

  if (existing) return existing;

  const channel = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
  });

  // =====================================
  // 💬 EMBED MESSAGE (NEW)
  // =====================================
  const embed = new EmbedBuilder()
    .setTitle("🧠 QuickAdd System")
    .setDescription(
`Automated OCR system for fast point tracking.

━━━━━━━━━━━━━━━━━━

🚀 **How to start**
Use:
/q start

Then choose a screenshot type and follow instructions in the thread.

━━━━━━━━━━━━━━━━━━

📊 **Supported types**
• Donations Points  
• Duel Points  
• Reservoir Signups  
• Reservoir Results  

━━━━━━━━━━━━━━━━━━

💡 Tip:
Each session runs in a private thread`
    )
    .setColor(0x5865F2); // Discord blurple

  await channel.send({ embeds: [embed] });

  return channel;
}

export function isQuickAddChannel(channelId: string, quickAddChannelId: string) {
  return channelId === quickAddChannelId;
}