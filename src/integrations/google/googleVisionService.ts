// =====================================
// 📁 src/integrations/google/GoogleVisionService.ts
// =====================================

/**
 * 🧠 ROLE:
 * Minimal Google Vision API client (OCR).
 *
 * Responsibilities:
 * - uses shared Google credentials
 * - sends request to Vision API
 * - returns raw response
 *
 * ❗ RULES:
 * - NO logging
 * - NO trace context
 * - NO parsing / business logic
 */

import * as vision from "@google-cloud/vision";
import { googleCredentials } from "./googleSheetsClient";

// =====================================
// 🔥 CLIENT (shared credentials)
// =====================================

const client = new vision.ImageAnnotatorClient({
  credentials: googleCredentials,
});

// =====================================
// 🔍 OCR
// =====================================

export async function runVisionOCR(
  buffer: Buffer
): Promise<vision.protos.google.cloud.vision.v1.IAnnotateImageResponse | null> {
  try {
    const [result] = await client.documentTextDetection({
      image: { content: buffer },
      imageContext: {
        languageHints: ["en"],
      },
    });

    return result ?? null;
  } catch {
    // transport layer intentionally silent
    return null;
  }
}