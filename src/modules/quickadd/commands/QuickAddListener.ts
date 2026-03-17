// src/modules/quickadd/commands/QuickAddListener.ts
import { Client, Message, TextChannel } from "discord.js";
import { rraddCommand } from "./rradd";
import { dpaddCommand } from "./dpadd";
import { dnaddCommand } from "./dnadd";
import { SessionManager } from "../session/SessionManager";
import { createQuickAddChannel } from "../session/createQuickAddChannel";

/**
 * Listener dla wszystkich komend QuickAdd z prefiksem `!`.
 * Obsługuje zarówno pełne nazwy, jak i skróty:
 *  !reservoiradd / !rradd
 *  !duelpointsadd / !dpadd
 *  !donationsadd / !dnadd
 */
export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    // Sprawdzenie, czy kanał jest dedykowany dla QuickAdd lub kanał jeszcze nie został stworzony
    const currentSessionChannel: TextChannel | null = SessionManager.getChannel();
    if (currentSessionChannel && message.channel.id !== currentSessionChannel.id) {
      await message.reply("⚠️ Komenda QuickAdd może być użyta tylko w kanale sesji QuickAdd.");
      return;
    }

    switch (command) {
      case "rradd":
      case "reservoiradd":
        await rraddCommand(message, args);
        break;

      case "dpadd":
      case "duelpointsadd":
        await dpaddCommand(message, args);
        break;

      case "dnadd":
      case "donationsadd":
        await dnaddCommand(message, args);
        break;

      default:
        // inne komendy QuickAdd (np. sesyjne) będą dodawane później
        break;
    }
  });
}