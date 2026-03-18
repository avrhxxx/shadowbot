import { Client, Message } from "discord.js";

// 🔹 komendy startowe
import { rradd } from "./commands/ReservoirAddCommand";
import { dnadd } from "./commands/DonationsAddCommand";
import { dpadd } from "./commands/DuelAddCommand";
import { rrattend } from "./commands/ReservoirAttendCommand";

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();

    if (!content.startsWith("!")) return;

    const [command] = content.slice(1).trim().split(/\s+/);

    try {
      switch (command.toLowerCase()) {
        case "rradd":
          await rradd(message);
          break;

        case "dnadd":
          await dnadd(message);
          break;

        case "dpadd":
          await dpadd(message);
          break;

        case "rrattend":
          await rrattend(message);
          break;

        default:
          return;
      }
    } catch (err) {
      console.error("QuickAdd error:", err);
      await message.reply("❌ Błąd.");
    }
  });
}