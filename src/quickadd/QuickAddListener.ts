// src/quickadd/QuickAddListener.ts

import { Client, Message } from "discord.js";

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

// 🔥 OCR
import { processOCR } from "./services/OCRService";

// 🔥 parser chain (manual fallback też używa tego)
import { parseByImageType } from "./parsers/ParserManager";

// 🔥 mapper OCR → Entry
function mapEntry(entry: any) {
  const valueNumber = parseInt(entry.value || "0");

  return {
    nickname: entry.nickname,
    value: isNaN(valueNumber) ? 0 : valueNumber,
    raw: entry.raw || entry.rawText || "",
  };
}

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

    // =====================================================
    // 🔹 KOMENDY
    // =====================================================
    if (content.startsWith("!")) {
      const [rawCommand] = content.slice(1).trim().split(/\s+/);
      const command = rawCommand.toLowerCase();

      try {
        // 🔥 START (FIXED)
        if (command === "start") {
          if (!isQuickAddChannel) {
            return message.reply("❌ Tylko w #quick-add.");
          }

          if (SessionManager.hasSession(message.guildId)) {
            return message.reply("❌ Masz już aktywną sesję.");
          }

          SessionManager.createSession({
            guildId: message.guildId,
            channelId: message.channel.id,
            moderatorId: message.author.id,

            // 🔥 required przez typy
            eventType: "rr", // tymczasowe
            mode: "auto",
            parserType: null,
          });

          await message.reply(
            "🟢 Session started.\n" +
            "📸 Send a screenshot or paste text — I will detect it automatically."
          );
          return;
        }

        if (command === "help") {
          await help(message);
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

    // =====================================================
    // 🔹 BRAK SESJI
    // =====================================================
    if (!session) return;
    if (message.channel.id !== session.channelId) return;
    if (session.moderatorId !== message.author.id) return;

    // =====================================================
    // 🖼️ OCR (SCREENY)
    // =====================================================
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();

      if (!attachment || !attachment.contentType?.startsWith("image/")) {
        return;
      }

      try {
        const parsed = await processOCR(attachment.url);

        if (!parsed || parsed.length === 0) {
          await message.reply(
            "❌ Couldn't detect data from the screenshot.\n" +
            "Try another image or enter data manually."
          );
          return;
        }

        for (const entry of parsed) {
          SessionData.addEntry(message.guildId!, mapEntry(entry));
        }

        await message.react("✅");
      } catch (err) {
        console.error("OCR error:", err);
        await message.react("❌");
      }

      return;
    }

    // =====================================================
    // 📝 MANUAL INPUT (AUTO-DETECT)
    // =====================================================
    if (content.length > 0) {
      try {
        const lines = content
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const parsed = parseByImageType(lines);

        if (!parsed || parsed.length === 0) {
          await message.reply(
            "❓ Couldn't detect data type.\n" +
            "Try:\n" +
            "• sending a screenshot\n" +
            "• or correcting the format"
          );
          return;
        }

        for (const entry of parsed) {
          SessionData.addEntry(message.guildId!, mapEntry(entry));
        }

        await message.react("✅");
      } catch (err) {
        console.error("Manual parse error:", err);
        await message.react("❌");
      }
    }
  });
}