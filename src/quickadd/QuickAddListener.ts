// src/quickadd/QuickAddListener.ts

import { Client, Message } from "discord.js";

// 🔹 commands
import { preview } from "./commands/PreviewCommand";
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { adjust } from "./commands/AdjustCommand";
import { deleteEntry } from "./commands/DeleteCommand";
import { merge } from "./commands/MergeCommand";
import { help } from "./commands/HelpCommand";

// 🔹 session
import { SessionManager } from "./session/SessionManager";
import { SessionData } from "./session/SessionData";
import { startQuickAddSession } from "./session/startQuickAddSession";

// 🔥 OCR
import { processOCR } from "./services/OCRService";

// 🔥 parser chain
import { parseByImageType } from "./parsers/ParserManager";

// 🔥 mapper
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
    // 🔹 COMMANDS
    // =====================================================
    if (content.startsWith("!")) {
      const [rawCommand] = content.slice(1).trim().split(/\s+/);
      const command = rawCommand.toLowerCase();

      try {
        // 🔥 START (FINAL FIX)
        if (command === "start") {
          return startQuickAddSession(message, "auto");
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
            return message.reply("❌ Use this in the session channel.");
          }

          if (session.moderatorId !== message.author.id) {
            return message.reply("❌ This is not your session.");
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
        await message.reply("❌ Error.");
      }

      return;
    }

    // =====================================================
    // 🔹 NO SESSION
    // =====================================================
    if (!session) return;
    if (message.channel.id !== session.channelId) return;
    if (session.moderatorId !== message.author.id) return;

    // =====================================================
    // 🖼️ OCR
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
    // 📝 MANUAL INPUT (AUTO DETECT)
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