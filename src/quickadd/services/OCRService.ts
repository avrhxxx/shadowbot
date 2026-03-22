// src/quickadd/services/OCRService.ts

import {
  extractTextFromImage,
  preprocessImage,
  splitAndCleanText,
  OCRRawResult,
} from "../utils/ocrPipeline";
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
export interface OCRProcessed {
  source: string;
  text: string;
  lines: string[];
}

// =====================================
// 🚀 MAIN
// =====================================
export async function processOCR(
  imageUrl: string
): Promise<OCRProcessed[]> {
  log("📸 FETCH IMAGE:", imageUrl);

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer || buffer.length < 100) {
    log("❌ INVALID IMAGE BUFFER");
    return [];
  }

  log("📸 IMAGE SIZE:", buffer.length);

  // =====================================
  // 🧹 PREPROCESS
  // =====================================
  const processedBuffer = await preprocessImage(buffer);

  // =====================================
  // 🧠 OCR (🔥 MULTI SOURCE)
  // =====================================
  const rawResults: OCRRawResult[] =
    await extractTextFromImage(processedBuffer);

  if (!rawResults?.length) {
    log("⚠️ OCR FAILED HARD");
    return [];
  }

  const finalResults: OCRProcessed[] = [];

  for (const raw of rawResults) {
    if (!raw.text || raw.text.trim().length < 5) {
      log(`⚠️ SKIP EMPTY OCR: ${raw.source}`);
      continue;
    }

    log(`🧠 PROCESSING SOURCE: ${raw.source}`);

    // =====================================
    // ✂️ SPLIT
    // =====================================
    let lines = splitAndCleanText(raw.text);
    log(`[${raw.source}] RAW LINES:`, lines.length);

    // =====================================
    // 🧹 CLEAN
    // =====================================
    lines = preprocessOCR(lines);
    log(`[${raw.source}] AFTER PREPROCESS:`, lines.length);

    // =====================================
    // 🔀 MERGE
    // =====================================
    lines = mergeBrokenLines(lines);
    log(`[${raw.source}] AFTER MERGE:`, lines.length);

    // =====================================
    // 📏 NORMALIZE
    // =====================================
    lines = normalizeLines(lines);
    log(`[${raw.source}] AFTER NORMALIZE:`, lines.length);

    // =====================================
    // 🔒 LIMIT
    // =====================================
    if (lines.length > 100) {
      log(`[${raw.source}] ⚠️ LIMIT APPLIED`);
      lines = lines.slice(0, 100);
    }

    // =====================================
    // 📊 DEBUG
    // =====================================
    log(`=== ${raw.source} FINAL PREVIEW ===`);
    lines.slice(0, 15).forEach((line, i) => {
      log(`[${raw.source}][${i}] ${line}`);
    });

    finalResults.push({
      source: raw.source,
      text: raw.text,
      lines,
    });
  }

  return finalResults;
}

// =====================================
// 🧹 CLEAN
// =====================================
function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[^\p{L}\p{N}\s:.,]/gu, "")
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

    if (cleaned.length < 3) continue;
    if (!/[a-zA-Z]/.test(cleaned) && !/\d{2,}/.test(cleaned)) continue;

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

    if (/^\d{2,}$/.test(current) && /^\d{3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    if (/^\d{2,}$/.test(current) && /^,\d{3}$/.test(next)) {
      merged.push(current + next.replace(",", ""));
      i++;
      continue;
    }

    if (/donat/i.test(current) && /^\d{2,6}$/.test(next)) {
      merged.push(`${current} ${next}`);
      i++;
      continue;
    }

    if (/donat/i.test(current) && /^,\d{3}$/.test(next)) {
      merged.push(`${current}${next}`);
      i++;
      continue;
    }

    if (/^\d{2,}$/.test(current) && /^\d{1,3}$/.test(next)) {
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