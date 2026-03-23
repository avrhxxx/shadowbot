// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { createLogger } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseOCR } from "../parsing";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { formatPreview } from "../utils/formatPreview";

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

// =====================================
// 🔥 HELPER: AUTO PREVIEW
// =====================================
async function sendAutoPreview(message: Message, traceId: string) {
  try {
    log.trace("auto_preview_triggered", traceId);

    if (!message.channel.isTextBased()) {
      log.warn("auto_preview_invalid_channel", {
        messageId: message.id,
      });
      return;
    }

    const data = QuickAddBuffer.getEntries(message.guild!.id);

    if (!data.length) {
      log.trace("auto_preview_skipped_empty", traceId);
      return;
    }

    const formatted = formatPreview(data);

    await message.channel.send({
      content:
`📊 QuickAdd Preview (${data.length} entries)

\`\`\`
${formatted}
\`\`\`

✏️ Adjust entry:
→ /qa adjust <id> <field> <value>
→ /quickadd adjust <id> <field> <value>`
    });

    log.trace("auto_preview_sent", traceId, {
      entries: data.length,
    });

  } catch (err) {
    log.warn("auto_preview_failed", err);
  }
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
    // 🔥 BUFFER
    // =============================
    QuickAddBuffer.addEntries(message.guild!.id, parsed);

    log.trace("buffer_updated", traceId, {
      added: parsed.length,
    });

    // =============================
    // 🔥 AUTO PREVIEW
    // =============================
    if (parsed.length > 0) {
      setTimeout(() => {
        sendAutoPreview(message, traceId);
      }, 500);
    } else {
      log.trace("auto_preview_skipped_no_data", traceId);
    }

    // =============================
    // ✅ DONE
    // =============================
    await setStatusReaction(message, "✅", traceId);

    // =============================
    // 🧹 SAFE DELETE
    // =============================
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