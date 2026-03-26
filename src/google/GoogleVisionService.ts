// =====================================
// 📁 src/google/GoogleVisionService.ts
// =====================================

/**
 * 🧠 ROLE:
 * Minimal Google Vision API client.
 *
 * Responsibilities:
 * - authenticate
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

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje GOOGLE_SERVICE_ACCOUNT!");
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const client = new vision.ImageAnnotatorClient({
  credentials,
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