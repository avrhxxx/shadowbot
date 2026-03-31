// =====================================
// 📁 src/integrations/google/googleVision.ts
// =====================================

import * as vision from "@google-cloud/vision";
import { googleCredentials } from "./googleClient.js"; // ✅ FIX

// =====================================
// 🔥 CLIENT (LAZY)
// =====================================

let client: vision.ImageAnnotatorClient | null = null;

function getClient(): vision.ImageAnnotatorClient {
  if (!client) {
    client = new vision.ImageAnnotatorClient({
      credentials: googleCredentials,
    });
  }

  return client;
}

// =====================================
// 🔍 OCR
// =====================================

export async function runVisionOCR(
  buffer: Buffer
): Promise<vision.protos.google.cloud.vision.v1.IAnnotateImageResponse | null> {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  try {
    const [result] = await getClient().documentTextDetection({
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

// =====================================
// 🔧 OPTIONAL HELPER
// =====================================

export function extractText(
  res: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse | null
): string | null {
  return res?.fullTextAnnotation?.text ?? null;
}