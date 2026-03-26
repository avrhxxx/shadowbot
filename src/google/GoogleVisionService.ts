// =====================================
// 📁 src/google/GoogleVisionService.ts
// =====================================

import vision from "@google-cloud/vision";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje GOOGLE_SERVICE_ACCOUNT!");
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const client = new vision.ImageAnnotatorClient({
  credentials,
});

// =====================================
// 🔥 RAW OCR (NO PROCESSING)
// =====================================

export async function runVisionOCR(buffer: Buffer) {
  try {
    const [result] = await client.documentTextDetection({
      image: { content: buffer },
      imageContext: {
        languageHints: ["en"],
      },
    });

    return result;

  } catch (err) {
    console.error("💥 GOOGLE VISION ERROR:", err);
    return null;
  }
}