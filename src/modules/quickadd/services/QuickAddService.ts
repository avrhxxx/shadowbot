// src/modules/quickadd/services/QuickAddService.ts
import { Client, Guild, TextChannel } from "discord.js";

export class QuickAddService {
  constructor(private client: Client) {}

  /**
   * Tworzy kanał #quickadd w podanym guildzie, jeśli nie istnieje.
   * Placeholder - na razie tylko loguje akcję.
   */
  async ensureQuickAddChannel(guild: Guild): Promise<TextChannel> {
    try {
      const existingChannel = guild.channels.cache.find(
        (ch) => ch.name === "quickadd" && ch.isTextBased()
      ) as TextChannel | undefined;

      if (existingChannel) {
        console.log(`[QuickAdd] Channel #quickadd already exists in guild ${guild.id}`);
        return existingChannel;
      }

      const channel = await guild.channels.create({
        name: "quickadd",
        type: 0, // Text channel
        reason: "QuickAdd channel placeholder creation",
      }) as TextChannel;

      console.log(`[QuickAdd] Created channel #quickadd in guild ${guild.id}`);
      return channel;
    } catch (err) {
      console.error(`[QuickAdd] Failed to ensure #quickadd channel in guild ${guild.id}:`, err);
      throw err; // pozwalamy indeksowi złapać błąd
    }
  }
}