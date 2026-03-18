import { Client, Message } from "discord.js";

// 🔹 komendy startowe
import { rradd } from "./commands/ReservoirAddCommand";
import { dnadd } from "./commands/DonationsAddCommand";
import { dpadd } from "./commands/DuelAddCommand";
import { rrattend } from "./commands/ReservoirAttendCommand";

// 🔹 preview + confirm + cancel + adjust + delete
import { preview } from "./commands/PreviewCommand";
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { adjust } from "./commands/AdjustCommand";
import { deleteEntry } from "./commands/DeleteCommand";

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
      const [rawCommand] = content.slice(1).trim().split(/\s+/);
      const command = rawCommand.toLowerCase();

      const isQuickAddChannel =
        message.channel.isTextBased() &&
        "name" in message.channel &&
        message.channel.name === "quick-add";

      try {
        switch (command) {
          // 🔥 START
          case "rradd":
            if (!isQuickAddChannel)
              return message.reply("❌ Tylko w #quick-add.");
            await rradd(message);
            break;

          case "dnadd":
            if (!isQuickAddChannel)
              return message.reply("❌ Tylko w #quick-add.");
            await dnadd(message);
            break;

          case "dpadd":
            if (!isQuickAddChannel)
              return message.reply("❌ Tylko w #quick-add.");
            await dpadd(message);
            break;

          case "rrattend":
            if (!isQuickAddChannel)
              return message.reply("❌ Tylko w #quick-add.");
            await rrattend(message);
            break;

          // 🔥 SESJA
          case "preview":
          case "confirm":
          case "cancel":
          case "adjust":
          case "delete":
            if (!session || message.channel.id !== session.channelId) {
              return message.reply("❌ Tylko w kanale sesji.");
            }

            if (session.moderatorId !== message.author.id) {
              return message.reply("❌ To nie Twoja sesja.");
            }

            if (command === "preview") await preview(message);
            if (command === "confirm") await confirm(message);
            if (command === "cancel") await cancel(message);
            if (command === "adjust") await adjust(message);
            if (command === "delete") await deleteEntry(message);
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
    // 🔹 BRAK SESJI
    // -----------------------------
    if (!session) return;

    // 🔹 tylko kanał sesji
    if (message.channel.id !== session.channelId) return;

    // 🔒 OWNER CHECK
    if (session.moderatorId !== message.author.id) return;

    // -----------------------------
    // 📝 PARSER
    // -----------------------------
    if (content.length > 0) {
      try {
        const parts = content.split(/\s+/);

        // tylko "nick value"
        if (parts.length !== 2) return;

        const nickname = parts[0];
        const rawValue = parts[1];

        const value = parseValue(rawValue);

        if (value === null) {
          await message.react("❌");
          return;
        }

        SessionData.addEntry(message.guildId, {
          nickname,
          value,
          raw: rawValue, // 🔥 klucz do poprawnego preview
        });

        await message.react("✅");
      } catch (err) {
        console.error("Parse error:", err);
        await message.react("❌");
      }
    }
  });
}