// =====================================
// 📁 src/quickadd/QuickAddListener.ts
// =====================================

import { Client, Message } from "discord.js";
import { processImageInput } from "./core/QuickAddPipeline";
import { QuickAddSession } from "./core/QuickAddSession";
import { createLogger } from "./debug/DebugLogger";

const log = createLogger("LISTENER");

// =====================================
function getImageUrl(message: Message): string | null {
  const attachment = message.attachments.first();
  if (attachment?.url) return attachment.url;

  const match = message.content.match(
    /(https?:\/\/.*\.(?:png|jpg|jpeg|webp))/i
  );

  return match ? match[1] : null;
}

// =====================================
export function registerQuickAddListener(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    try {
      if (message.author.bot) return;
      if (!message.guild) return;

      const guildId = message.guild.id;
      const channelId = message.channel.id;
      const userId = message.author.id;

      log("message_received", {
        user: userId,
        channel: channelId,
      });

      const session = QuickAddSession.get(guildId);

      if (!session) {
        log("listener_ignored_no_session", {
          guildId,
        });
        return;
      }

      // =====================================
      // 🔒 ONLY ACTIVE THREAD
      // =====================================
      if (!QuickAddSession.isInSession(guildId, channelId)) {
        log("listener_ignored_outside_thread", {
          channelId,
          expected: session.threadId,
        });
        return;
      }

      // =====================================
      // 🔒 ONLY SESSION OWNER
      // =====================================
      if (!QuickAddSession.isOwner(guildId, userId)) {
        log("listener_ignored_wrong_user", {
          userId,
          owner: session.ownerId,
        });
        return;
      }

      log("listener_accepted", {
        user: userId,
        threadId: channelId,
      });

      const imageUrl = getImageUrl(message);

      if (!imageUrl) {
        log("no_image");
        return;
      }

      const traceId = Date.now().toString().slice(-5);

      log.trace("image_detected", traceId, imageUrl);

      await processImageInput(message, session, imageUrl, traceId);

    } catch (err) {
      log.error("listener_error", err);
    }
  });
}