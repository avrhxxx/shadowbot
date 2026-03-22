// src/quickadd/utils/ocrPipeline.ts

import sharp from "sharp";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import FormData from "form-data";

// =====================================
const DEBUG_OCR = true;

function log(...args: any[]) {
  if (DEBUG_OCR) console.log("[OCR]", ...args);
}

// =====================================
// 📸 PREPROCESS (bez zmian)
export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 2000 })
    .grayscale()
    .linear(1.5, -10)
    .sharpen({ sigma: 1.2 })
    .median(1)
    .threshold(140)
    .toBuffer();
}

// =====================================
// 🧠 MAIN OCR → ZWRACA 3 WERSJE!
export async function extractOCRVariants(image: Buffer) {
  log("🚀 OCR VARIANTS START");

  const [ocrSpace, tFull, tLine, tBlock] = await Promise.all([
    runOCRSpace(image),
    runTesseract(image, 3),  // full page
    runTesseract(image, 7),  // line mode 🔥
    runTesseract(image, 6),  // UI/block 🔥
  ]);

  return {
    ocrSpace: splitLines(ocrSpace),
    full: splitLines(tFull),
    line: splitLines(tLine),
    block: splitLines(tBlock),
  };
}

// =====================================
function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
}

// =====================================
// 🌐 OCR.space
async function runOCRSpace(image: Buffer): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", image, "image.png");
    formData.append("apikey", "helloworld");

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
// 🤖 Tesseract (z parametrem)
async function runTesseract(image: Buffer, psm: number): Promise<string> {
  try {
    const worker = await Tesseract.createWorker();

    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    await worker.setParameters({
      tessedit_pageseg_mode: psm as any,
    });

    const result = await worker.recognize(image);

    await worker.terminate();

    return result.data.text || "";
  } catch {
    return "";
  }
}