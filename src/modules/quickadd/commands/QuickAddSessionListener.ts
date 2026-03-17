import { Client, Message } from "discord.js";
import { previewCommand, adjustCommand, repairCommand } from "./QuickAddSessionCommands";

/**
 * Listener dla sesyjnych komend QuickAdd w kanale sesji
 */
export function registerQuickAddSessionListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    switch (command) {
      case "preview":
        await previewCommand(message);
        break;
      case "adjust":
        await adjustCommand(message, args);
        break;
      case "repair":
        await repairCommand(message);
        break;
      case "redo":
      case "confirm":
      case "cancel":
        await message.reply(`${command} command placeholder.`);
        break;
      default:
        break;
    }
  });
}