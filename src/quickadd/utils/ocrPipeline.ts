// src/quickadd/utils/ocrPipeline.ts

import sharp from "sharp";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import FormData from "form-data";

// =====================================
// 🔥 DEBUG CONFIG
// =====================================
const DEBUG_OCR = true;
const DEBUG_OCR_VERBOSE = false;

function log(...args: any[]) {
  if (DEBUG_OCR) {
    console.log("[OCR]", ...args);
  }
}

// =====================================
// 📸 PREPROCESS IMAGE
// =====================================
export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  log("📸 INPUT SIZE:", buffer.length);

  const out = await sharp(buffer)
    .resize({ width: 2000 })
    .grayscale()
    .linear(1.5, -10)
    .sharpen({ sigma: 1.2 })
    .median(1)
    .threshold(140)
    .toBuffer();

  log("🧹 PREPROCESS DONE:", out.length);

  return out;
}

// =====================================
// 🧠 MAIN OCR ENTRY (🔥 NOWY SYSTEM)
// =====================================
export interface OCRRawResult {
  source: string;
  text: string;
}

export async function extractTextFromImage(
  image: Buffer
): Promise<OCRRawResult[]> {
  log("🚀 Running parallel OCR...");

  const [ocrSpaceText, tesseractText, tesseractUI] = await Promise.all([
    runOCRSpace(image),
    runTesseract(image),
    runTesseractUI(image),
  ]);

  const results: OCRRawResult[] = [
    { source: "OCR_SPACE", text: ocrSpaceText || "" },
    { source: "TESSERACT_RAW", text: tesseractText || "" },
    { source: "TESSERACT_UI", text: tesseractUI || "" },
  ];

  for (const r of results) {
    log(`🧠 ${r.source} LENGTH:`, r.text.length);

    if (DEBUG_OCR_VERBOSE) {
      log(`📄 ${r.source} FULL:\n`, r.text);
    } else {
      log(`📄 ${r.source} PREVIEW:\n`, r.text.slice(0, 300));
    }
  }

  // 🔥 ZERO MERGE — każdy OCR osobno
  return results;
}

// =====================================
// 🌐 OCR.space
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
    log("❌ OCR.space FAILED");
    return "";
  }
}

// =====================================
// 🤖 Tesseract DEFAULT
// =====================================
async function runTesseract(image: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(image, "eng", {
      logger: () => {},
    });

    return result.data.text || "";
  } catch {
    log("❌ Tesseract FAILED");
    return "";
  }
}

// =====================================
// 🤖 Tesseract UI MODE
// =====================================
async function runTesseractUI(image: Buffer): Promise<string> {
  try {
    const worker = await Tesseract.createWorker();

    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    await worker.setParameters({
      tessedit_pageseg_mode: 6 as any,
    });

    const result = await worker.recognize(image);

    await worker.terminate();

    return result.data.text || "";
  } catch {
    log("❌ Tesseract UI FAILED");
    return "";
  }
}

// =====================================
// 🧹 CLEAN HELPERS (zostają – będą używane później)
// =====================================
export function splitAndCleanText(text: string): string[] {
  return text
    .split("\n")
    .map((l) => unicodeCleaner(l))
    .map((l) => l.trim())
    .filter(Boolean);
}

// =====================================
function unicodeCleaner(input: string): string {
  return input
    .normalize("NFC")
    .trim()
    .replace(/\p{C}/gu, "");
}