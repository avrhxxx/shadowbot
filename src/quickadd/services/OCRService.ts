// src/quickadd/services/OCRService.ts

import { extractTextFromImage, preprocessImage } from "../utils/ocrPipeline";
import fetch from "node-fetch";

// =====================================
// 🔥 DEBUG
// =====================================
const DEBUG_OCR_SERVICE = true;

function log(...args: any[]) {
  if (DEBUG_OCR_SERVICE) {
    console.log("[OCR:SERVICE]", ...args);
  }
}

// =====================================
export interface OCRResult {
  text: string;
  lines: string[];
}

// =====================================
// 🚀 MAIN
// =====================================
export async function processOCR(imageUrl: string): Promise<OCRResult> {
  log("📸 FETCH IMAGE:", imageUrl);

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer || buffer.length < 100) {
    log("❌ INVALID IMAGE BUFFER");
    return { text: "", lines: [] };
  }

  log("📸 IMAGE SIZE:", buffer.length);

  // =====================================
  // 🧹 PREPROCESS
  // =====================================
  const processedBuffer = await preprocessImage(buffer);

  // =====================================
  // 🧠 OCR
  // =====================================
  const text = await extractTextFromImage(processedBuffer);

  log("🧠 OCR LENGTH:", text.length);

  if (!text || text.trim().length < 5) {
    log("⚠️ OCR FAILED HARD");
    return { text: "", lines: [] };
  }

  // =====================================
  // ✂️ SPLIT
  // =====================================
  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  log("📄 RAW LINES:", lines.length);

  // =====================================
  // 🧹 CLEAN
  // =====================================
  lines = preprocessOCR(lines);
  log("🧹 AFTER PREPROCESS:", lines.length);

  lines = mergeBrokenLines(lines);
  log("🔀 AFTER MERGE:", lines.length);

  lines = normalizeLines(lines);
  log("📏 AFTER NORMALIZE:", lines.length);

  // =====================================
  // 🔒 LIMIT
  // =====================================
  if (lines.length > 100) {
    log("⚠️ LINE LIMIT APPLIED (100)");
    lines = lines.slice(0, 100);
  }

  // =====================================
  // 📊 FINAL DEBUG
  // =====================================
  log("=== FINAL LINES PREVIEW ===");
  lines.slice(0, 20).forEach((line, i) => {
    log(`[${i}] "${line}"`);
  });

  return { text, lines };
}

// =====================================
// 🧹 CLEAN
// =====================================
function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[ÔÇś@%*=~`"'\\]/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    if (
      lower.includes("tap to") ||
      lower.includes("share") ||
      lower.includes("copy") ||
      lower === "ok"
    ) continue;

    result.push(cleaned);
  }

  return result;
}

// =====================================
// 🔀 MERGE
// =====================================
function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let current = lines[i];
    const next = lines[i + 1];

    if (!next) {
      merged.push(current);
      continue;
    }

    // 41 + 999
    if (/^\d{2,}$/.test(current) && /^\d{2,3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    // 41 + ,999
    if (/^\d{2,}$/.test(current) && /^,\d{3}$/.test(next)) {
      merged.push(current + next.replace(",", ""));
      i++;
      continue;
    }

    // donations split
    if (/donat/i.test(current) && /^,\d{3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

// =====================================
// 📏 NORMALIZE
// =====================================
function normalizeLines(lines: string[]): string[] {
  return lines.map((line) =>
    line
      .replace(/(\d)\s+(\d{3})/g, "$1$2")
      .replace(/,\s*(\d{3})/g, ",$1")
      .replace(/\s+/g, " ")
      .trim()
  );
}