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

      log("message_received", {
        user: message.author.id,
        channel: message.channel.id,
      });

      const session = QuickAddSession.get(message.guild.id);

      if (!session) {
        log("no_session");
        return;
      }

      if (session.channelId !== message.channel.id) {
        log("wrong_channel");
        return;
      }

      if (session.ownerId !== message.author.id) {
        log("ignored_not_owner", message.author.id);
        return;
      }

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