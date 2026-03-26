// =====================================
// 📁 src/google/GoogleVisionService.ts
// =====================================

/**
 * 🧠 ROLE:
 * Minimal Google Vision API client.
 *
 * Responsibilities:
 * - use shared GoogleAuth
 * - send request
 * - return raw response
 *
 * ❗ RULES:
 * - NO logging
 * - NO traceId
 * - NO OCR logic
 * - NO transformation
 */

import vision from "@google-cloud/vision";
import { googleAuth } from "./googleSheetsClient";

// 🔥 używamy WSPÓLNEGO AUTH
const client = new vision.ImageAnnotatorClient({
  auth: googleAuth,
});

export async function runVisionOCR(buffer: Buffer) {
  try {
    const [result] = await client.documentTextDetection({
      image: { content: buffer },
      imageContext: {
        languageHints: ["en"],
      },
    });

    return result ?? null;

  } catch {
    return null;
  }
}