import vision from "@google-cloud/vision";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje GOOGLE_SERVICE_ACCOUNT!");
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const client = new vision.ImageAnnotatorClient({
  credentials,
});

export async function extractTextGoogle(buffer: Buffer): Promise<string> {
  try {
    const [result] = await client.documentTextDetection({
      image: { content: buffer },
    });

    const text = result.fullTextAnnotation?.text || "";

    console.log("🧠 [VISION OCR LENGTH]:", text.length);

    return text;

  } catch (err) {
    console.error("💥 GOOGLE VISION ERROR:", err);
    return "";
  }
}