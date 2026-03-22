// src/quickadd/QuickAddListener.ts

import {
  Client,
  Message,
} from "discord.js";

import { processImageInput } from "./core/QuickAddPipeline";
import { QuickAddSession } from "./core/QuickAddSession";
import { debug } from "./debug/DebugLogger";

// =============================
const TRACE = "LISTENER";

// =============================
function getImageUrl(message: Message): string | null {
  // 📸 attachment (najczęstsze)
  const attachment = message.attachments.first();
  if (attachment?.url) return attachment.url;

  // 🔗 fallback: link w treści
  const urlMatch = message.content.match(
    /(https?:\/\/.*\.(?:png|jpg|jpeg|webp))/i
  );

  return urlMatch ? urlMatch[1] : null;
}

// =============================
export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    try {
      // -----------------------------
      // ❌ IGNORE BOT
      // -----------------------------
      if (message.author.bot) return;

      // -----------------------------
      // ❌ IGNORE DM
      // -----------------------------
      if (!message.guild) return;

      // -----------------------------
      // 📦 SESSION
      // -----------------------------
      const session = QuickAddSession.get(message.guild.id);

      if (!session) return;

      // -----------------------------
      // 🔒 CHANNEL LOCK
      // -----------------------------
      if (session.channelId !== message.channel.id) return;

      // -----------------------------
      // 🔒 OWNER LOCK
      // -----------------------------
      if (session.ownerId !== message.author.id) {
        debug(TRACE, "IGNORED_NOT_OWNER", message.author.id);
        return;
      }

      // -----------------------------
      // 📸 IMAGE DETECTION
      // -----------------------------
      const imageUrl = getImageUrl(message);

      if (!imageUrl) {
        debug(TRACE, "NO_IMAGE");
        return;
      }

      debug(TRACE, "IMAGE_DETECTED", imageUrl);

      // -----------------------------
      // 🚀 PIPELINE
      // -----------------------------
      await processImageInput(message, session, imageUrl);

    } catch (err) {
      console.error("❌ QuickAddListener error:", err);
    }
  });
}