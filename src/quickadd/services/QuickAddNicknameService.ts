// src/quickadd/services/QuickAddNicknameService.ts

import { readSheet, appendQuickAddRows } from "../../googleSheetsStorage";

const TYPE = "nickname";

interface NickMapping {
  ocr: string;
  final: string;
  override?: string;
  createdAt: number;
}

// =====================================
// 🧠 INTERNAL CACHE
// =====================================
let cache: NickMapping[] | null = null;

// =====================================
// 📥 LOAD FROM SHEETS
// =====================================
async function loadMappings(): Promise<NickMapping[]> {
  if (cache) return cache;

  const rows = await readSheet("quickadd");

  if (!rows || rows.length <= 1) {
    cache = [];
    return [];
  }

  const parsed: NickMapping[] = rows
    .slice(1)
    .map((r) => ({
      type: r[0],
      ocr: r[1],
      final: r[2],
      override: r[3],
      createdAt: Number(r[4]),
    }))
    .filter((r) => r.type === TYPE && r.ocr)
    .map((r) => ({
      ocr: r.ocr.trim(),
      final: r.final?.trim() || "",
      override: r.override?.trim() || "",
      createdAt: r.createdAt || 0,
    }));

  cache = parsed;
  return parsed;
}

// =====================================
// 💾 SAVE (AFTER CONFIRM)
// =====================================
export async function saveNickMappings(
  entries: { nickname: string; raw: string }[]
) {
  console.log("🧠 [NickService] Saving mappings...");

  const rowsToAppend: {
    type: string;
    ocr: string;
    final: string;
    override: string;
    createdAt: number;
  }[] = [];

  const now = Date.now();

  for (const e of entries) {
    const raw = e.raw?.trim();
    const final = e.nickname?.trim();

    if (!raw || !final) continue;

    // 🔥 skip jeśli identyczne
    if (raw.toLowerCase() === final.toLowerCase()) continue;

    console.log(`➕ ${raw} → ${final}`);

    rowsToAppend.push({
      type: TYPE,
      ocr: raw,
      final,
      override: "", // 🔥 ręczna kolumna – pusta na start
      createdAt: now,
    });
  }

  if (!rowsToAppend.length) {
    console.log("⚠️ No mappings to save");
    return;
  }

  await appendQuickAddRows(rowsToAppend);

  // 🔄 invalidate cache
  cache = null;

  console.log(`✅ Saved ${rowsToAppend.length} mappings`);
}

// =====================================
// 🔍 RESOLVE (OVERRIDE FIRST)
// =====================================
export async function resolveNickname(raw: string): Promise<string> {
  const mappings = await loadMappings();

  const found = mappings.find(
    (m) => m.ocr.toLowerCase() === raw.toLowerCase()
  );

  if (found) {
    if (found.override) {
      console.log(`🧠 OVERRIDE: ${raw} → ${found.override}`);
      return found.override;
    }

    if (found.final) {
      console.log(`🎯 RESOLVE: ${raw} → ${found.final}`);
      return found.final;
    }
  }

  return raw;
}

// =====================================
// 🔍 FUZZY MATCH (z override)
// =====================================
export async function resolveNicknameFuzzy(raw: string): Promise<string> {
  const mappings = await loadMappings();

  let best: { score: number; value: string } | null = null;

  for (const m of mappings) {
    const score = similarity(raw, m.ocr);

    if (score > 0.8 && (!best || score > best.score)) {
      const value = m.override || m.final;

      if (!value) continue;

      best = {
        score,
        value,
      };
    }
  }

  if (best) {
    console.log(`🧠 FUZZY RESOLVE: ${raw} → ${best.value}`);
    return best.value;
  }

  return raw;
}

// =====================================
// 🔧 SIMPLE SIMILARITY
// =====================================
function similarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "");

  a = normalize(a);
  b = normalize(b);

  if (a === b) return 1;

  let matches = 0;
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / len;
}