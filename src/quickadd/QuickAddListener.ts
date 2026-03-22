// src/quickadd/QuickAddListener.ts

import { Client, Message } from "discord.js";

import { preview } from "./commands/PreviewCommand";
import { confirm } from "./commands/ConfirmCommand";
import { cancel } from "./commands/CancelCommand";
import { adjust } from "./commands/AdjustCommand";
import { deleteEntry } from "./commands/DeleteCommand";
import { merge } from "./commands/MergeCommand";
import { help } from "./commands/HelpCommand";

// ✅ FIX: SessionManager → SessionStore
import { SessionStore } from "./session/sessionStore";

import { startQuickAddSession } from "./utils/startQuickAddSession";

// ✅ FIX: FlowService → Pipeline
import {
  processImageInput,
  processTextInput,
} from "./services/QuickAddPipeline";

// =====================================
// 🔹 MAIN LISTENER (CZYSTY ROUTER)
// =====================================
export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guildId) return;

    const content = message.content.trim();

    // ✅ FIX
    const session = SessionStore.getSession(message.guildId);

    console.log("=== NEW MESSAGE ===");
    console.log("Content:", content);

    // =====================================================
    // 🔥 KOMENDY
    // =====================================================
    if (content.startsWith("!")) {
      const [rawCommand] = content.slice(1).trim().split(/\s+/);
      const command = rawCommand.toLowerCase();

      console.log("COMMAND:", command);

      // 🚀 START (nie wymaga sesji)
      if (command === "start") {
        await startQuickAddSession(message, "auto");
        return;
      }

      // ❌ brak sesji
      if (!session) {
        await message.reply("❌ No active session.");
        return;
      }

      // 🔒 walidacja sesji
      if (message.channel.id !== session.channelId) {
        await message.reply("❌ Use session channel.");
        return;
      }

      if (session.moderatorId !== message.author.id) {
        await message.reply("❌ Not your session.");
        return;
      }

      // 📦 KOMENDY SESJI
      if (command === "preview") return preview(message);
      if (command === "confirm") return confirm(message);
      if (command === "cancel") return cancel(message);
      if (command === "adjust") return adjust(message);
      if (command === "delete") return deleteEntry(message);
      if (command === "merge") return merge(message);
      if (command === "help") return help(message);

      console.log("❓ Unknown command");
      return;
    }

    // =====================================================
    // ❌ BRAK SESJI
    // =====================================================
    if (!session) return;

    // 🔒 walidacja sesji
    if (message.channel.id !== session.channelId) return;
    if (session.moderatorId !== message.author.id) return;

    // =====================================================
    // 🖼️ OCR (SCREENY)
    // =====================================================
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (!attachment || !attachment.contentType?.startsWith("image/")) return;

      try {
        console.log("📸 ROUTE → IMAGE FLOW");

        await processImageInput(message, session, attachment.url);
      } catch (err) {
        console.error("OCR error:", err);
        await message.react("❌");
      }

      return;
    }

    // =====================================================
    // 📝 MANUAL INPUT
    // =====================================================
    if (content.length > 0) {
      try {
        console.log("📝 ROUTE → TEXT FLOW");

        await processTextInput(message, session, content);
      } catch (err) {
        console.error("Manual parse error:", err);
        await message.react("❌");
      }
    }
  });
}