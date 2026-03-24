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
  // 💬 EMBED MESSAGE (UPDATED UX + FUTURE MULTI-SCREEN)
  // =====================================
  const embed = new EmbedBuilder()
    .setTitle("🧠 QuickAdd System")
    .setDescription(
`Read player data from screenshots (nicknames + points) and turn it into clean, ready-to-use data — no manual typing needed.

━━━━━━━━━━━━━━━━━━

🚀 **How to use**

1. Use \`/q start\`  
2. Choose what type of screenshot you're sending  
3. Go to the created thread  
4. Send your screenshots  

👉 The system will automatically detect players and their data

━━━━━━━━━━━━━━━━━━

📊 **What you can scan**

• Donations rankings  
• Duel points  
• Reservoir signups  
• Reservoir results  

━━━━━━━━━━━━━━━━━━

⚠️ **Review before confirm**

You can review and edit everything before confirming.

━━━━━━━━━━━━━━━━━━

📸 **Screenshots**

You can send multiple screenshots — data will be combined automatically.

━━━━━━━━━━━━━━━━━━

💡 **Tip**

Each session runs in a private thread — just drop screenshots there and you're good to go`
    )
    .setColor(0x5865F2); // Discord blurple

  await channel.send({ embeds: [embed] });

  return channel;
}

export function isQuickAddChannel(channelId: string, quickAddChannelId: string) {
  return channelId === quickAddChannelId;
}