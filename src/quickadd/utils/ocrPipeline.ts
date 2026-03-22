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
// 🧠 MAIN OCR ENTRY
// =====================================
export async function extractTextFromImage(image: Buffer): Promise<string> {
  log("🚀 Running parallel OCR...");

  const [ocrSpaceText, tesseractText, tesseractUI] = await Promise.all([
    runOCRSpace(image),
    runTesseract(image),
    runTesseractUI(image),
  ]);

  log("🧠 OCR.space LENGTH:", ocrSpaceText.length);
  log("🧠 Tesseract LENGTH:", tesseractText.length);
  log("🧠 Tesseract UI LENGTH:", tesseractUI.length);

  if (DEBUG_OCR_VERBOSE) {
    log("📄 OCR.space FULL:\n", ocrSpaceText);
    log("📄 Tesseract FULL:\n", tesseractText);
    log("📄 Tesseract UI FULL:\n", tesseractUI);
  } else {
    log("📄 OCR.space PREVIEW:\n", ocrSpaceText.slice(0, 300));
    log("📄 Tesseract PREVIEW:\n", tesseractText.slice(0, 300));
    log("📄 Tesseract UI PREVIEW:\n", tesseractUI.slice(0, 300));
  }

  const merged = mergeOCRResults([
    ocrSpaceText,
    tesseractText,
    tesseractUI,
  ]);

  log("🔥 MERGED LENGTH:", merged.length);
  log("📄 FINAL PREVIEW:\n", merged.slice(0, 300));

  // 🔥 KLUCZOWY DEBUG (CAŁY OUTPUT)
  log("=== FINAL OCR OUTPUT ===\n" + merged);

  // 🔥 ILE LINII FINALNIE
  log("🧾 TOTAL LINES AFTER MERGE:", merged.split("\n").length);

  return merged;
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
// 🤖 Tesseract UI MODE (FIXED 🔥)
// =====================================
async function runTesseractUI(image: Buffer): Promise<string> {
  try {
    const worker = await Tesseract.createWorker();

    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    await worker.setParameters({
      tessedit_pageseg_mode: 6 as any, // 🔥 FIX (number zamiast string)
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
// 🔀 SMART MERGE (ORDER SAFE)
// =====================================
function mergeOCRResults(texts: string[]): string {
  const linesSets = texts.map(t =>
    t
      .split("\n")
      .map(l => unicodeCleaner(l))
      .map(l => l.trim())
      .filter(Boolean)
  );

  const maxLen = Math.max(...linesSets.map(l => l.length));
  const merged: string[] = [];

  log("🔀 SMART MERGE START");
  log("SETS:", linesSets.length, "| MAX:", maxLen);

  for (let i = 0; i < maxLen; i++) {
    const candidates = linesSets
      .map(set => set[i])
      .filter(Boolean);

    if (!candidates.length) continue;

    const unique: string[] = [];

    for (const c of candidates) {
      if (!unique.some(u => isSimilar(u, c))) {
        unique.push(c);
      }
    }

    const best = pickBestLine(unique);

    if (DEBUG_OCR_VERBOSE) {
      log(`LINE ${i}`, "CANDIDATES:", candidates);
      log(`LINE ${i}`, "UNIQUE:", unique);
      log(`LINE ${i}`, "PICKED:", best);
    }

    merged.push(best);
  }

  return merged.join("\n");
}

// =====================================
// 🧠 SIMILARITY
// =====================================
function isSimilar(a: string, b: string): boolean {
  a = normalizeCompare(a);
  b = normalizeCompare(b);

  if (a === b) return true;

  let matches = 0;
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / len > 0.7;
}

function normalizeCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// =====================================
// 🧠 LINE SCORING
// =====================================
function pickBestLine(lines: string[]): string {
  let best = lines[0];
  let bestScore = scoreLine(best);

  for (const line of lines.slice(1)) {
    const score = scoreLine(line);
    if (score > bestScore) {
      best = line;
      bestScore = score;
    }
  }

  return best;
}

function scoreLine(line: string): number {
  let score = 0;

  score += Math.min(line.length, 50);

  if (/\d/.test(line)) score += 20;
  if (/donations/i.test(line)) score += 30;

  const garbage = (line.match(/[^a-zA-Z0-9\s:,]/g) || []).length;
  score -= garbage * 2;

  return score;
}

// =====================================
// 🧹 UNICODE CLEANER
// =====================================
function unicodeCleaner(input: string): string {
  return input
    .normalize("NFC")
    .trim()
    .replace(/\p{C}/gu, "");
}