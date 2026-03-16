// src/modules/quickadd/commands/QuickAddChannelInit.ts

import { Client, TextChannel, PermissionsBitField, ChannelType } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function initQuickAddChannel(client: Client) {
  const sessionManager = SessionManager.getInstance();

  for (const guild of client.guilds.cache.values()) {
    let quickAddChannel = guild.channels.cache.find(
      ch => ch.name === "quickadd" && ch.type === ChannelType.GuildText
    ) as TextChannel | undefined;

    if (!quickAddChannel) {
      try {
        quickAddChannel = await guild.channels.create({
          name: "quickadd",
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.SendMessages],
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });

        console.log(`✅ Utworzono kanał #quickadd w guild ${guild.id}`);
      } catch (err) {
        console.error("❌ Błąd tworzenia kanału QuickAdd:", err);
        continue;
      }
    } else {
      console.log(`ℹ️ Kanał #quickadd już istnieje w guild ${guild.id}`);
    }

    // Rejestracja kanału w SessionManager
    if (quickAddChannel) {
      sessionManager.registerQuickAddChannel?.(quickAddChannel.id);
    }
  }
}