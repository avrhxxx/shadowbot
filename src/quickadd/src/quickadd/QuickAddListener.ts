import { Client, Message } from "discord.js";
import { SessionManager } from "./session/SessionManager";

// komendy startowe
import { rradd } from "./commands/ReservoirAddCommand";
import { dnadd } from "./commands/DonationsAddCommand";
import { dpadd } from "./commands/DuelAddCommand";
import { rrattend } from "./commands/ReservoirAttendCommand";

// komendy sesyjne (na później — możesz jeszcze nie mieć wszystkich)
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { preview } from "./commands/PreviewCommand";
import { adjust } from "./commands/AdjustCommand";
import { redo } from "./commands/RedoCommand";

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();

    // -----------------------------
    // 🔹 KOMENDY PREFIX (!)
    // -----------------------------
    if (content.startsWith("!")) {
      const [command, ...args] = content.slice(1).split(" ");

      try {
        switch (command.toLowerCase()) {

          // 🔥 START SESJI
          case "rradd":
            await rradd(message, args);
            break;

          case "dnadd":
            await dnadd(message, args);
            break;

          case "dpadd":
            await dpadd(message, args);
            break;

          case "rrattend":
            await rrattend(message, args);
            break;

          // 🔥 KOMENDY SESYJNE
          case "confirm":
            await confirm(message);
            break;

          case "cancel":
            await cancel(message);
            break;

          case "preview":
            await preview(message);
            break;

          case "adjust":
            await adjust(message, args);
            break;

          case "redo":
            await redo(message);
            break;

          default:
            return;
        }
      } catch (err) {
        console.error("QuickAdd command error:", err);
        await message.reply("❌ Błąd podczas wykonywania komendy.");
      }

      return;
    }

    // -----------------------------
    // 🔹 OBSŁUGA WIADOMOŚCI W SESJI
    // -----------------------------
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.getSession(message.guildId);

    if (!session) return;

    // ❗ ważne: tylko w kanale sesji
    if (message.channel.id !== session.channelId) return;

    // 🔥 LOG (na start — później tu parser)
    console.log("📥 QuickAdd session message:", message.content);

    // TODO (następny krok):
    // if (message.attachments.size > 0) {
    //   // OCR
    // } else {
    //   // parser tekstu
    // }
  });
}