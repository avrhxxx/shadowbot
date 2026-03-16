import { Client, TextChannel, PermissionsBitField } from "discord.js";
import { QuickAddSessionManager } from "../session/SessionManager";

export async function initQuickAddChannel(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    let quickAddChannel = guild.channels.cache.find(
      ch => ch.name === "quickadd" && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!quickAddChannel) {
      try {
        quickAddChannel = await guild.channels.create({
          name: "quickadd",
          type: 0, // TextChannel
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.SendMessages],
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
        console.log(`Utworzono kanał #quickadd w guild ${guild.id}`);
      } catch (err) {
        console.error("Błąd tworzenia kanału QuickAdd:", err);
        continue;
      }
    } else {
      console.log(`Kanał #quickadd już istnieje w guild ${guild.id}`);
    }

    // Rejestracja kanału w menedżerze sesji
    QuickAddSessionManager.registerQuickAddChannel(quickAddChannel.id);
  }
}