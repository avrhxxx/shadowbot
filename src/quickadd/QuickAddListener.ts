import { Client, Message } from "discord.js";
import { SessionManager } from "./session/SessionManager";

// 🔹 parser
import { getParser } from "./parsers/getParser";

// 🔹 komendy startowe
import { rradd } from "./commands/ReservoirAddCommand";
import { dnadd } from "./commands/DonationsAddCommand";
import { dpadd } from "./commands/DuelAddCommand";
import { rrattend } from "./commands/ReservoirAttendCommand";

// 🔹 komendy sesyjne
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { preview } from "./commands/PreviewCommand";

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.getSession(message.guildId);
    const isOwner = session && message.author.id === session.moderatorId;

    // -----------------------------
    // 🔹 KOMENDY PREFIX (!)
    // -----------------------------
    if (content.startsWith("!")) {
      const [command, ...args] = content.slice(1).trim().split(/\s+/);

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

          // 🔥 KOMENDY SESYJNE (tylko owner)
          case "confirm":
          case "cancel":
            if (!session) {
              await message.reply("❌ Brak aktywnej sesji.");
              return;
            }

            if (!isOwner) {
              await message.reply("❌ Tylko twórca sesji może używać tej komendy.");
              return;
            }

            if (command === "confirm") await confirm(message);
            if (command === "cancel") await cancel(message);
            break;

          // 🔧 TYMCZASOWO WYŁĄCZONE
          case "adjust":
          case "redo":
            await message.reply("⚠️ Jeszcze nie działa.");
            break;

          // 🔥 PREVIEW (może każdy)
          case "preview":
            await preview(message);
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
    if (!session) return;

    // ❗ tylko kanał sesji
    if (message.channel.id !== session.channelId) return;

    // 🔥 odświeżenie aktywności
    sessionManager.touchSession(message.guildId);

    // -----------------------------
    // 📸 ZAŁĄCZNIKI (OCR - przyszłość)
    // -----------------------------
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();

      console.log("📸 Attachment received:", attachment?.url);

      // TODO: OCR później
      await message.react("📥");
      return;
    }

    // -----------------------------
    // 📝 TEKST (🔥 PARSER)
    // -----------------------------
    if (content.length > 0) {
      try {
        const parser = getParser(session.eventType);

        const parsedEntries = parser.parseMany(content);

        for (const entry of parsedEntries) {
          session.previewBuffer.addEntry({
            nickname: entry.nickname,
            value: String(entry.value ?? 0)
          });
        }

        console.log("✅ Parsed entries:", parsedEntries);

        await message.react("✅");
      } catch (err) {
        console.error("❌ Parser error:", err);
        await message.react("❌");
      }

      return;
    }
  });
}