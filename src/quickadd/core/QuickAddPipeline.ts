// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message, AttachmentBuilder } from "discord.js";
import { createLogger } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseOCR } from "../parsing";
import { QuickAddBuffer } from "../storage/QuickAddBuffer"; // 🔥 NEW
import { formatPreview } from "../utils/formatPreview"; // 🔥 NEW

const log = createLogger("PIPELINE");

// =====================================
// 🔥 HELPER: STATUS REACTIONS
// =====================================
async function setStatusReaction(message: Message, emoji: string, traceId?: string) {
  const tid = traceId ?? "no-trace";

  try {
    log.trace("reaction_set_start", tid, {
      messageId: message.id,
      emoji,
    });

    await message.reactions.removeAll();
    await message.react(emoji);

    log.trace("reaction_set_done", tid, {
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
    // 🔥 AUTO PREVIEW (REAL)
    // =============================
    if (message.channel.isTextBased()) {
      const allData = QuickAddBuffer.getEntries(message.guild!.id);

      const preview = formatPreview(allData);

      const content = `
📊 QuickAdd Preview (${allData.length} entries)

${preview}

────────────────────────────

✏️ Adjust entry:
→ /qa adjust <id> <field> <value>
→ /quickadd adjust <id> <field> <value>

Example:
→ /qa adjust 1 value 60000

💡 Pro tip:
Fix OCR mistakes like wrong numbers or nicknames.
`.trim();

      await message.channel.send({ content });

      log.trace("preview_sent", traceId, {
        entries: allData.length,
      });
    }

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