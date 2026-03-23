// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message, AttachmentBuilder } from "discord.js";
import { debugTrace } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseOCR } from "../parsing";

const SCOPE = "PIPELINE";

export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string,
  traceId: string
) {
  debugTrace(SCOPE, "IMAGE_RECEIVED", traceId, {
    user: message.author.id,
    url: imageUrl,
  });

  try {
    console.log("🔥 OCR CALL START", traceId);

    // =============================
    // 🔥 OCR
    // =============================
    const ocrResult = await runOCR(imageUrl);

    console.log("🔥 OCR CALL END", traceId);

    debugTrace(SCOPE, "OCR_RESULT", traceId, ocrResult);

    // =============================
    // 🔥 PARSING
    // =============================
    const parsed = parseOCR(ocrResult.lines, traceId);

    debugTrace(SCOPE, "PARSED_RESULT", traceId, parsed);

    // =============================
    // 📤 DEBUG → WYŚLIJ NA PRIV
    // =============================
    try {
      const content = `
TRACE ID: ${traceId}

=== OCR TEXT ===
${ocrResult.text}

=== PARSED ===
${JSON.stringify(parsed, null, 2)}
      `.trim();

      const buffer = Buffer.from(content, "utf-8");

      const file = new AttachmentBuilder(buffer, {
        name: `quickadd_${traceId}.txt`,
      });

      await message.author.send({
        content: `📄 QuickAdd debug (${traceId})`,
        files: [file],
      });
    } catch (err) {
      console.error("❌ Failed to send DM debug:", err);
    }

    // =============================
    // 🔜 NEXT (później)
    // =============================
    // - detection (typ obrazka)
    // - mapping nicków
    // - zapis do buffer

  } catch (err) {
    console.error("❌ Pipeline OCR error:", err);
  }
}