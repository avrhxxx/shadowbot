// =====================================
// 📁 src/integrations/google/GoogleVisionService.ts
// =====================================

/**
 * 🧠 ROLE:
 * Minimal Google Vision API client.
 *
 * Responsibilities:
 * - use shared GoogleAuth credentials
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

// 🔥 Shared credentials (single source of truth)
const client = new vision.ImageAnnotatorClient({
  credentials: googleCredentials,
});

// =====================================
// OCR
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
    // intentional: transport layer stays silent
    return null;
  }
}