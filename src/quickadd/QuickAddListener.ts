// src/quickadd/QuickAddListener.ts

import { Client, Message } from "discord.js";
import { processImageInput } from "./core/QuickAddPipeline";
import { QuickAddSession } from "./core/QuickAddSession";
import { debug, debugTrace } from "./debug/DebugLogger";

const SCOPE = "LISTENER";

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

      debug(SCOPE, "MESSAGE_RECEIVED", {
        user: message.author.id,
        channel: message.channel.id,
      });

      const session = QuickAddSession.get(message.guild.id);

      if (!session) {
        debug(SCOPE, "NO_SESSION");
        return;
      }

      if (session.channelId !== message.channel.id) {
        debug(SCOPE, "WRONG_CHANNEL");
        return;
      }

      if (session.ownerId !== message.author.id) {
        debug(SCOPE, "IGNORED_NOT_OWNER", message.author.id);
        return;
      }

      const imageUrl = getImageUrl(message);

      if (!imageUrl) {
        debug(SCOPE, "NO_IMAGE");
        return;
      }

      const traceId = Date.now().toString().slice(-5);

      debugTrace(SCOPE, "IMAGE_DETECTED", traceId, imageUrl);

      await processImageInput(message, session, imageUrl, traceId);

    } catch (err) {
      console.error("❌ QuickAddListener error:", err);
    }
  });
}