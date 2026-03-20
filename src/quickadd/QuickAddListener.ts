import { Client, Message } from "discord.js";

import { preview } from "./commands/PreviewCommand";
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { adjust } from "./commands/AdjustCommand";
import { deleteEntry } from "./commands/DeleteCommand";
import { merge } from "./commands/MergeCommand";
import { help } from "./commands/HelpCommand";

import { SessionManager } from "./session/SessionManager";
import { SessionData } from "./session/SessionData";

import { processOCR } from "./services/OCRService";
import { parseByImageType } from "./parsers/ParserManager";

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

    // =========================
    // ❌ BRAK SESJI
    // =========================
    if (!session) return;
    if (message.channel.id !== session.channelId) return;
    if (session.moderatorId !== message.author.id) return;

    // =========================
    // 🖼️ OCR
    // =========================
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (!attachment || !attachment.contentType?.startsWith("image/")) return;

      try {
        const { type, entries } = await processOCR(attachment.url);

        // 🔥 AUTO-DETECT + LOCK
        if (!session.parserType && type) {
          session.parserType = type;
          console.log(`🔒 Parser locked: ${type}`);
        }

        // 🔒 BLOKADA MIXU
        if (session.parserType && type && session.parserType !== type) {
          await message.reply(
            `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
          );
          return;
        }

        if (!entries || entries.length === 0) {
          await message.reply("❌ Couldn't detect data.");
          return;
        }

        for (const entry of entries) {
          SessionData.addEntry(message.guildId!, mapEntry(entry));
        }

        await message.react("✅");
      } catch (err) {
        console.error("OCR error:", err);
        await message.react("❌");
      }

      return;
    }

    // =========================
    // 📝 MANUAL
    // =========================
    if (content.length > 0) {
      try {
        const lines = content
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const { type, entries } = parseByImageType(lines);

        // 🔥 AUTO-DETECT + LOCK
        if (!session.parserType && type) {
          session.parserType = type;
          console.log(`🔒 Parser locked: ${type}`);
        }

        // 🔒 BLOKADA MIXU
        if (session.parserType && type && session.parserType !== type) {
          await message.reply(
            `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
          );
          return;
        }

        if (!entries || entries.length === 0) {
          await message.reply("❌ Couldn't detect data type.");
          return;
        }

        for (const entry of entries) {
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