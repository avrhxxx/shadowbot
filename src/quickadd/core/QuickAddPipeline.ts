// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { debugTrace } from "../debug/DebugLogger";
import { runOCR } from "../ocr/OCRService"; // 🔥 NEW

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
    // =============================
    // 🔥 OCR START
    // =============================
    const ocrResult = await runOCR(imageUrl);

    debugTrace(SCOPE, "OCR_RESULT", traceId, ocrResult);

    // =============================
    // 🔜 TODO (następne etapy)
    // =============================
    // - detection (typ obrazka)
    // - parsing
    // - mapping nicków
    // - zapis do buffer

  } catch (err) {
    console.error("❌ Pipeline OCR error:", err);
  }
}