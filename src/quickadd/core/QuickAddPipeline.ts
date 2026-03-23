// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message, AttachmentBuilder } from "discord.js";
import { createLogger } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseOCR } from "../parsing";
import { QuickAddBuffer } from "../storage/QuickAddBuffer"; // 🔥 NEW

const log = createLogger("PIPELINE");

// =====================================
// 🔥 HELPER: STATUS REACTIONS
// =====================================
async function setStatusReaction(message: Message, emoji: string) {
  try {
    await message.reactions.removeAll();
    await message.react(emoji);
  } catch (err) {
    console.error("❌ Reaction error:", err);
  }
}

// =====================================
// 🔥 HELPER: SAFE DELETE
// =====================================
function scheduleSafeDelete(message: Message, delay = 15000) {
  setTimeout(async () => {
    try {
      if (!message.deletable) {
        log.warn("message_not_deletable", {
          messageId: message.id,
        });
        return;
      }

      await message.delete();

      log.trace("message_deleted", null, {
        messageId: message.id,
      });
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
  log.trace("image_received", traceId, {
    user: message.author.id,
    url: imageUrl,
  });

  // 📥 RECEIVED
  await setStatusReaction(message, "📥");

  try {
    log.trace("ocr_start", traceId);

    // ⏳ PROCESSING
    await setStatusReaction(message, "⏳");

    // =============================
    // 🔥 OCR
    // =============================
    const ocrResult = await runOCR(imageUrl);

    log.trace("ocr_end", traceId);

    log.trace("ocr_result", traceId, ocrResult);

    // =============================
    // 🔥 PARSING
    // =============================
    const parsed = parseOCR(ocrResult.lines, traceId);

    log.trace("parsed_result", traceId, parsed);

    // =============================
    // 🔥 BUFFER (NOWE)
    // =============================
    QuickAddBuffer.addEntries(message.guild!.id, parsed);

    log.trace("buffer_updated", traceId, {
      added: parsed.length,
    });

    // =============================
    // 📤 DEBUG → WYŚLIJ NA PRIV (TEMP DISABLED)
    // =============================
    // try {
    //   const content = `
    // TRACE ID: ${traceId}
    //
    // === OCR TEXT ===
    // ${ocrResult.text}
    //
    // === PARSED ===
    // ${JSON.stringify(parsed, null, 2)}
    //   `.trim();
    //
    //   const buffer = Buffer.from(content, "utf-8");
    //
    //   const file = new AttachmentBuilder(buffer, {
    //     name: `quickadd_${traceId}.txt`,
    //   });
    //
    //   await message.author.send({
    //     content: `📄 QuickAdd debug (${traceId})`,
    //     files: [file],
    //   });
    //
    //   log.trace("debug_dm_sent", traceId);
    // } catch (err) {
    //   log.warn("debug_dm_failed", err);
    // }

    // =============================
    // 🔜 NEXT
    // =============================
    // - detection
    // - mapping
    // - approval

    // ✅ DONE
    await setStatusReaction(message, "✅");

    // 🧹 SAFE DELETE (only if parsed data exists)
    if (parsed.length > 0) {
      scheduleSafeDelete(message, 15000);
    }

  } catch (err) {
    log.error("pipeline_error", err, traceId);

    // ❌ ERROR
    await setStatusReaction(message, "❌");
  }
}