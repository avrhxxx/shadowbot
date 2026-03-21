import vision from "@google-cloud/vision";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje GOOGLE_SERVICE_ACCOUNT!");
}

// 🔥 parsujemy service account z env
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// 🔥 klient Vision (ten sam service account co Sheets)
const client = new vision.ImageAnnotatorClient({
  credentials,
});

// =====================================
// 🔥 OCR MAIN
// =====================================
export async function extractTextGoogle(buffer: Buffer): Promise<string> {
  try {
    const [result] = await client.textDetection({
      image: { content: buffer },

      // 🔥 OGROMNY BOOST JAKOŚCI
      imageContext: {
        languageHints: ["en"], // możesz dać ["en", "pl"]
      },
    });

    const text = result.fullTextAnnotation?.text || "";

    console.log("🧠 [VISION OCR LENGTH]:", text.length);

    if (!text || text.length < 10) {
      console.log("⚠️ [VISION] Empty or very short OCR result");
    }

    return text;
  } catch (err) {
    console.error("💥 GOOGLE VISION ERROR:", err);
    return "";
  }
}