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

// 🔥 preview message per guild (anti-spam)
const previewMessages = new Map<string, string>();

async function setStatusReaction(message: Message, emoji: string, traceId?: string) {
  const tid = traceId ?? "no-trace";

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

    // =============================
    // 🔥 OCR (TRACE ENABLED)
    // =============================
    const ocrResult = await runOCR(imageUrl, traceId);

    // =============================
    // 🔥 DETECTION (NEW)
    // =============================
    const type = detectImageType(ocrResult.lines);

    log.trace("detected_type", traceId, { type });

    // =============================
    // 🔥 PARSING
    // =============================
    const parsed = parseOCR(ocrResult.lines, traceId);

    // =============================
    // 🔥 BUFFER
    // =============================
    QuickAddBuffer.addEntries(guildId, parsed);

    // =============================
    // 🔥 PREVIEW (ANTI-SPAM)
    // =============================
    if ("send" in message.channel) {
      const allData = QuickAddBuffer.getEntries(guildId);
      const content = formatPreview(allData);

      const existingId = previewMessages.get(guildId);

      try {
        if (existingId) {
          const existingMsg = await message.channel.messages.fetch(existingId).catch(() => null);

          if (existingMsg) {
            await existingMsg.edit({ content });
            log.trace("preview_updated", traceId, { entries: allData.length });
          } else {
            const sent = await message.channel.send({ content });
            previewMessages.set(guildId, sent.id);
            log.trace("preview_recreated", traceId);
          }
        } else {
          const sent = await message.channel.send({ content });
          previewMessages.set(guildId, sent.id);
          log.trace("preview_created", traceId);
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