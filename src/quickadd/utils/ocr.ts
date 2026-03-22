import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import FormData from "form-data";
import { mergeOCRResults } from "./ocrMerge";

export async function extractTextFromImage(image: Buffer): Promise<string> {
  console.log("🚀 Running parallel OCR...");

  const [ocrSpaceText, tesseractText] = await Promise.all([
    runOCRSpace(image),
    runTesseract(image),
  ]);

  console.log("🧠 OCR.space LENGTH:", ocrSpaceText.length);
  console.log("🧠 Tesseract LENGTH:", tesseractText.length);

  // 🔥 MERGE zamiast SELECT
  const merged = mergeOCRResults([ocrSpaceText, tesseractText]);

  console.log("🔥 MERGED LENGTH:", merged.length);

  return merged;
}

// =====================================
// OCR.space
// =====================================
async function runOCRSpace(image: Buffer): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", image, "image.png");
    formData.append("apikey", "helloworld");
    formData.append("language", "eng");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData as any,
    });

    const data: any = await res.json();
    return data?.ParsedResults?.[0]?.ParsedText || "";
  } catch {
    return "";
  }
}

// =====================================
// Tesseract
// =====================================
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