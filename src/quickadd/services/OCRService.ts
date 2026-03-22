// src/quickadd/services/OCRService.ts

import { extractOCRVariants, preprocessImage } from "../utils/ocrPipeline";
import fetch from "node-fetch";

// =====================================
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log("[OCR:SERVICE]", ...args);
}

// =====================================
export async function processOCR(imageUrl: string) {
  const res = await fetch(imageUrl);
  const buffer = Buffer.from(await res.arrayBuffer());

  const processed = await preprocessImage(buffer);

  // 🔥 NOWE: 3 źródła
  const variants = await extractOCRVariants(processed);

  const merged = smartMerge(variants);

  log("🔥 FINAL LINES:", merged.length);

  return {
    text: merged.join("\n"),
    lines: merged,
  };
}

// =====================================
// 🔀 NOWY MERGE (NAJWAŻNIEJSZE 🔥)
function smartMerge(v: any): string[] {
  const max = Math.max(
    v.full.length,
    v.line.length,
    v.block.length,
    v.ocrSpace.length
  );

  const result: string[] = [];

  for (let i = 0; i < max; i++) {
    const candidates = [
      v.full[i],
      v.line[i],
      v.block[i],
      v.ocrSpace[i],
    ].filter(Boolean);

    if (!candidates.length) continue;

    const best = pickBest(candidates);

    result.push(best);
  }

  return cleanLines(result);
}

// =====================================
function pickBest(lines: string[]): string {
  let best = lines[0];
  let bestScore = score(best);

  for (const l of lines.slice(1)) {
    const s = score(l);
    if (s > bestScore) {
      best = l;
      bestScore = s;
    }
  }

  return best;
}

// =====================================
function score(line: string): number {
  let s = 0;

  if (/\d/.test(line)) s += 20;
  if (/[a-zA-Z]/.test(line)) s += 10;
  if (/donat/i.test(line)) s += 40;

  const garbage = (line.match(/[^a-zA-Z0-9\s:,]/g) || []).length;
  s -= garbage * 2;

  s += Math.min(line.length, 40);

  return s;
}

// =====================================
function cleanLines(lines: string[]): string[] {
  return lines
    .map(l =>
      l
        .replace(/[^\p{L}\p{N}\s:.,]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(l => l.length > 2);
}