import { Client, Message } from "discord.js";

// 🔹 komendy startowe
import { rradd } from "./commands/ReservoirAddCommand";
import { dnadd } from "./commands/DonationsAddCommand";
import { dpadd } from "./commands/DuelAddCommand";
import { rrattend } from "./commands/ReservoirAttendCommand";

// 🔹 preview + confirm + cancel
import { preview } from "./commands/PreviewCommand";
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";

// 🔹 sesja + dane
import { SessionManager } from "./session/SessionManager";
import { SessionData } from "./session/SessionData";

// 🔥 parser
import { parseValue } from "./utils/parseValue";

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();
    const session = SessionManager.getSession(message.guildId);

    // -----------------------------
    // 🔹 KOMENDY (!)
    // -----------------------------
    if (content.startsWith("!")) {
      const [command] = content.slice(1).trim().split(/\s+/);

      const isQuickAddChannel = message.channel.name === "quick-add";

      try {
        switch (command.toLowerCase()) {
          // 🔥 START (tylko #quick-add)
          case "rradd":
          case "dnadd":
          case "dpadd":
          case "rrattend":
            if (!isQuickAddChannel) {
              await message.reply("❌ Ta komenda działa tylko w #quick-add.");
              return;
            }

            if (command === "rradd") await rradd(message);
            if (command === "dnadd") await dnadd(message);
            if (command === "dpadd") await dpadd(message);
            if (command === "rrattend") await rrattend(message);
            break;

          // 🔥 SESJA (tylko kanał sesji)
          case "preview":
          case "confirm":
          case "cancel":
            if (!session || message.channel.id !== session.channelId) {
              await message.reply("❌ Ta komenda działa tylko w kanale sesji.");
              return;
            }

            if (command === "preview") await preview(message);
            if (command === "confirm") await confirm(message);
            if (command === "cancel") await cancel(message);
            break;

          default:
            return;
        }
      } catch (err) {
        console.error("QuickAdd error:", err);
        await message.reply("❌ Błąd.");
      }

      return;
    }

    // -----------------------------
    // 🔹 BRAK SESJI → ignoruj
    // -----------------------------
    if (!session) return;

    // 🔹 tylko kanał sesji
    if (message.channel.id !== session.channelId) return;

    // -----------------------------
    // 📝 PARSER
    // -----------------------------
    if (content.length > 0) {
      try {
        const parts = content.split(/\s+/);

        if (parts.length < 2) {
          await message.react("❌");
          return;
        }

        const nickname = parts[0];
        const value = parseValue(parts[1]);

        if (value === null) {
          await message.react("❌");
          return;
        }

        SessionData.addEntry(message.guildId, {
          nickname,
          value,
        });

        await message.react("✅");
      } catch (err) {
        console.error("Parse error:", err);
        await message.react("❌");
      }

      return;
    }
  });
}