// src/quickadd/utils/ocr.ts
import fetch from "node-fetch";
import FormData from "form-data";
import Tesseract from "tesseract.js";

// ==============================
// 🔹 OCR.space
// ==============================
async function runOCRSpace(image: Buffer): Promise<string> {
  try {
    const form = new FormData();
    form.append("file", image, "image.png");
    form.append("apikey", "helloworld");
    form.append("language", "eng");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: form,
    });

    const data: any = await res.json();

    if (data?.IsErroredOnProcessing) return "";

    return data?.ParsedResults?.[0]?.ParsedText || "";
  } catch {
    return "";
  }
}

// ==============================
// 🔹 Tesseract
// ==============================
async function runTesseract(image: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(image, "eng", {
      logger: () => {},
    });

    return result.data.text || "";
  } catch {
    return "";
  }
}

// ==============================
// 🔥 SCORING SYSTEM
// ==============================
function score(text: string): number {
  let s = 0;

  s += text.length; // długość
  s += (text.match(/\d/g) || []).length * 3; // cyfry (ważne!)
  s += text.split("\n").length * 5; // linie

  return s;
}

// ==============================
// 🔥 MAIN (PARALLEL OCR)
// ==============================
export async function extractTextFromImage(image: Buffer): Promise<string> {
  console.log("🚀 Running parallel OCR...");

  const [spaceText, tessText] = await Promise.all([
    runOCRSpace(image),
    runTesseract(image),
  ]);

  console.log("🧠 OCR.space LENGTH:", spaceText.length);
  console.log("🧠 Tesseract LENGTH:", tessText.length);

  const spaceScore = score(spaceText);
  const tessScore = score(tessText);

  console.log("📊 OCR.space SCORE:", spaceScore);
  console.log("📊 Tesseract SCORE:", tessScore);

  const best = spaceScore >= tessScore ? spaceText : tessText;

  console.log("🏆 SELECTED:", spaceScore >= tessScore ? "OCR.space" : "Tesseract");

  return best;
}