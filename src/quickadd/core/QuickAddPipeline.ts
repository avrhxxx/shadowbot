// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { debugTrace } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService";
import { parseOCR } from "../parsing"; // 🔥 NEW

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
    // 🔥 HARD DEBUG
    console.log("🔥 OCR CALL START", traceId);

    // =============================
    // 🔥 OCR
    // =============================
    const ocrResult = await runOCR(imageUrl);

    console.log("🔥 OCR CALL END", traceId);

    debugTrace(SCOPE, "OCR_RESULT", traceId, ocrResult);

    // =============================
    // 🔥 PARSING (NOWY ETAP)
    // =============================
    const parsed = parseOCR(ocrResult.lines);

    debugTrace(SCOPE, "PARSED_RESULT", traceId, parsed);

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