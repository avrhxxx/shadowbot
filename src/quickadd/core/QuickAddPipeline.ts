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
async function setStatusReaction(message: Message, emoji: string, traceId?: string) {
  try {
    log.trace("reaction_set_start", traceId, {
      messageId: message.id,
      emoji,
    });

    await message.reactions.removeAll();
    await message.react(emoji);

    log.trace("reaction_set_done", traceId, {
      messageId: message.id,
      emoji,
    });
  } catch (err) {
    log.warn("reaction_set_failed", {
      messageId: message.id,
      emoji,
      err,
    });
  }
}

// =====================================
// 🔥 HELPER: SAFE DELETE
// =====================================
function scheduleSafeDelete(message: Message, traceId: string, delay = 15000) {
  log.trace("delete_scheduled", traceId, {
    messageId: message.id,
    delay,
  });

  setTimeout(async () => {
    try {
      log.trace("delete_attempt", traceId, {
        messageId: message.id,
      });

      if (!message.deletable) {
        log.warn("message_not_deletable", {
          messageId: message.id,
        });
        return;
      }

      await message.delete();

      log.trace("message_deleted", traceId, {
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
  await setStatusReaction(message, "📥", traceId);

  try {
    log.trace("ocr_start", traceId);

    // ⏳ PROCESSING
    await setStatusReaction(message, "⏳", traceId);

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
    await setStatusReaction(message, "✅", traceId);

    // 🧹 SAFE DELETE (only if parsed data exists)
    if (parsed.length > 0) {
      scheduleSafeDelete(message, traceId, 15000);
    } else {
      log.trace("delete_skipped_no_data", traceId, {
        messageId: message.id,
      });
    }

  } catch (err) {
    log.error("pipeline_error", err, traceId);

    // ❌ ERROR
    await setStatusReaction(message, "❌", traceId);
  }
}