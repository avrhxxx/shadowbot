import { TextChannel, Guild } from "discord.js";

export async function createQuickAddChannel(guild: Guild): Promise<TextChannel> {
  const channel = await guild.channels.create({
    name: "quickadd-session",
    type: 0 // GUILD_TEXT
  });

  return channel as TextChannel;
}