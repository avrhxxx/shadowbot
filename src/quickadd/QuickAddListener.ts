import { Client, Message } from "discord.js";

// 🔹 komendy startowe
import { rradd } from "./commands/ReservoirAddCommand";
import { dnadd } from "./commands/DonationsAddCommand";
import { dpadd } from "./commands/DuelAddCommand";
import { rrattend } from "./commands/ReservoirAttendCommand";

// 🔹 preview + confirm + cancel + adjust + delete + merge + help
import { preview } from "./commands/PreviewCommand";
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { adjust } from "./commands/AdjustCommand";
import { deleteEntry } from "./commands/DeleteCommand";
import { merge } from "./commands/MergeCommand";
import { help } from "./commands/HelpCommand";

// 🔹 sesja + dane
import { SessionManager } from "./session/SessionManager";
import { SessionData } from "./session/SessionData";

// 🔥 parser (manual input)
import { parseValue } from "./utils/parseValue";

export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();
    const session = SessionManager.getSession(message.guildId);

    const isQuickAddChannel =
      message.channel.isTextBased() &&
      "name" in message.channel &&
      message.channel.name === "quick-add";

    // -----------------------------
    // 🔹 KOMENDY (!)
    // -----------------------------
    if (content.startsWith("!")) {
      const [rawCommand] = content.slice(1).trim().split(/\s+/);
      const command = rawCommand.toLowerCase();

      try {
        if (command === "help") {
          await help(message);
          return;
        }

        if (
          command === "rradd" ||
          command === "dnadd" ||
          command === "dpadd" ||
          command === "rrattend"
        ) {
          if (!isQuickAddChannel) {
            return message.reply("❌ Tylko w #quick-add.");
          }

          if (command === "rradd") await rradd(message);
          if (command === "dnadd") await dnadd(message);
          if (command === "dpadd") await dpadd(message);
          if (command === "rrattend") await rrattend(message);

          return;
        }

        if (
          command === "preview" ||
          command === "confirm" ||
          command === "cancel" ||
          command === "adjust" ||
          command === "delete" ||
          command === "merge"
        ) {
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
          if (command === "merge") await merge(message);

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
    if (message.channel.id !== session.channelId) return;
    if (session.moderatorId !== message.author.id) return;

    // -----------------------------
    // 🖼️ OCR (SCREENY)
    // -----------------------------
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();

      if (!attachment || !attachment.contentType?.startsWith("image/")) {
        return;
      }

      try {
        const { extractTextFromImage } = await import("./utils/ocr");
        const { parserMap } = await import("./parsers/parserMap");

        const text = await extractTextFromImage(attachment.url);

        // 🔥 DEBUG OCR
        console.log("=== OCR TEXT START ===");
        console.log(text);
        console.log("=== OCR TEXT END ===");

        const parser = parserMap[session.parserType];
        if (!parser) return;

        // 🔥 FIX: parser oczekuje string[]
        const lines = text.split("\n");
        const parsed = parser(lines);

        // 🔥 DEBUG PARSER
        console.log("=== PARSED OUTPUT ===");
        console.log(parsed);
        console.log("=====================");

        if (!parsed || parsed.length === 0) {
          await message.react("❌");
          return;
        }

        for (const entry of parsed) {
          SessionData.addEntry(message.guildId!, entry);
        }

        await message.react("✅");
      } catch (err) {
        console.error("OCR error:", err);
        await message.react("❌");
      }

      return;
    }

    // -----------------------------
    // 📝 MANUAL INPUT
    // -----------------------------
    if (content.length > 0) {
      try {
        const parts = content.split(/\s+/);

        if (session.mode === "add") {
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
            raw: rawValue,
          });

          await message.react("✅");
          return;
        }

        if (session.mode === "attend") {
          if (parts.length !== 1) return;

          const nickname = parts[0];

          SessionData.addEntry(message.guildId, {
            nickname,
            value: 1,
            raw: "ATTEND",
          });

          await message.react("✅");
          return;
        }
      } catch (err) {
        console.error("Parse error:", err);
        await message.react("❌");
      }
    }
  });
}