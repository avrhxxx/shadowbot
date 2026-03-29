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

import * as vision from "@google-cloud/vision";
import { googleCredentials } from "./googleSheetsClient";

// 🔥 używamy WSPÓLNYCH credentials (bez hacków typu "as any")
const client = new vision.ImageAnnotatorClient({
  credentials: googleCredentials,
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