// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { createLogger } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseOCR } from "../parsing";
import { detectImageType } from "../detection/ImageTypeDetector";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { formatPreview } from "../utils/formatPreview";

const log = createLogger("PIPELINE");

const previewMessages = new Map<string, string>();

async function setStatusReaction(message: Message, emoji: string, traceId?: string) {
  try {
    await message.reactions.removeAll();
    await message.react(emoji);
  } catch (err) {
    log.warn("reaction_set_failed", { emoji, err });
  }
}

function scheduleSafeDelete(message: Message, traceId: string, delay = 15000) {
  setTimeout(async () => {
    try {
      if (!message.deletable) return;
      await message.delete();
    } catch (err) {
      log.warn("message_delete_failed", err);
    }
  }, delay);
}

export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string,
  traceId: string
) {
  const guildId = message.guild!.id;

  await setStatusReaction(message, "📥", traceId);

  try {
    await setStatusReaction(message, "⏳", traceId);

    const ocrResult = await runOCR(imageUrl, traceId);

    const type = detectImageType(ocrResult.lines);

    if (!type) {
      log.warn("unknown_image_type", traceId);
    }

    const parsed = parseOCR(ocrResult.lines, traceId);

    QuickAddBuffer.addEntries(guildId, parsed);

    // 🔥 FIX guard
    if (message.channel && "send" in message.channel) {
      const allData = QuickAddBuffer.getEntries(guildId);
      const content = formatPreview(allData);

      const existingId = previewMessages.get(guildId);

      try {
        if (existingId) {
          const existingMsg = await message.channel.messages.fetch(existingId).catch(() => null);

          if (existingMsg) {
            await existingMsg.edit({ content });
          } else {
            const sent = await message.channel.send({ content });
            previewMessages.set(guildId, sent.id);
          }
        } else {
          const sent = await message.channel.send({ content });
          previewMessages.set(guildId, sent.id);
        }
      } catch (err) {
        log.warn("preview_failed", err);
      }
    }

    await setStatusReaction(message, "✅", traceId);

    if (parsed.length > 0) {
      scheduleSafeDelete(message, traceId);
    }

  } catch (err) {
    log.error("pipeline_error", err, traceId);
    await setStatusReaction(message, "❌", traceId);
  }
}