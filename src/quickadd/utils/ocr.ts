// src/quickadd/utils/ocr.ts
import fetch from "node-fetch";
import FormData from "form-data";
import Tesseract from "tesseract.js";

// ==============================
// 🔹 FALLBACK: TESSERACT
// ==============================
async function fallbackTesseract(image: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(image, "eng", {
      logger: () => {},
    });

    const text = result.data.text || "";
    console.log("🧠 Tesseract LENGTH:", text.length);

    return text;
  } catch (err) {
    console.error("💥 Tesseract FAIL:", err);
    return "";
  }
}

// ==============================
// 🔹 MAIN OCR (OCR.space)
// ==============================
export async function extractTextFromImage(image: Buffer): Promise<string> {
  try {
    const form = new FormData();
    form.append("file", image, "image.png");
    form.append("apikey", "helloworld"); // 🔥 darmowy key
    form.append("language", "eng");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: form,
    });

    const data: any = await res.json();

    if (data?.IsErroredOnProcessing) {
      console.error("OCR.space error:", data);

      console.log("⚠️ Fallback → Tesseract");
      return await fallbackTesseract(image);
    }

    const text = data?.ParsedResults?.[0]?.ParsedText || "";

    console.log("🧠 OCR.space LENGTH:", text.length);

    // 🔥 fallback jeśli wynik słaby
    if (!text || text.length < 20) {
      console.log("⚠️ OCR.space słaby → fallback Tesseract");
      return await fallbackTesseract(image);
    }

    return text;

  } catch (err) {
    console.error("💥 OCR.space FAIL:", err);

    console.log("⚠️ Fallback → Tesseract");
    return await fallbackTesseract(image);
  }
}