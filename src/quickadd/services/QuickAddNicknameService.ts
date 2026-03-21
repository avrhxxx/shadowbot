// src/quickadd/services/QuickAddNicknameService.ts
import * as GS from "../../googleSheetsStorage";

const TYPE = "nickname";

interface NickMapping {
  ocr: string;
  final: string;
  override?: string;
  createdAt: number;
}

interface RawRow {
  type: string;
  ocr: string;
  final: string;
  override?: string;
  createdAt: number;
}

let cache: NickMapping[] | null = null;

// =====================================
// 📥 LOAD FROM SHEETS
// =====================================
async function loadMappings(): Promise<NickMapping[]> {
  if (cache) return cache;

  const rows = await GS.readSheet("quickadd");

  if (!rows || rows.length <= 1) {
    cache = [];
    return [];
  }

  const parsed: NickMapping[] = rows
    .slice(1)
    .map((r: unknown[]): RawRow => ({
      type: String(r[0] ?? ""),
      ocr: String(r[1] ?? ""),
      final: String(r[2] ?? ""),
      override: String(r[3] ?? ""),
      createdAt: Number(r[4] ?? 0),
    }))
    .filter((r: RawRow) => r.type === TYPE && r.ocr)
    .map((r: RawRow) => ({
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

    // 🔥 FILTRY
    if (raw.length < 3) continue;
    if (!/[a-z]/i.test(raw)) continue;
    if (/donat/i.test(raw)) continue;
    if (/^\d+$/.test(raw)) continue;

    console.log(`➕ ${raw} → ${final}`);

    rowsToAppend.push({
      type: TYPE,
      ocr: raw,
      final,
      override: "",
      createdAt: now,
    });
  }

  if (!rowsToAppend.length) {
    console.log("⚠️ No mappings to save");
    return;
  }

  await GS.appendQuickAddRows(rowsToAppend);

  cache = null;

  console.log(`✅ Saved ${rowsToAppend.length} mappings`);
}

// =====================================
// 🔍 RESOLVE (OVERRIDE FIRST)
// =====================================
export async function resolveNickname(raw: string): Promise<string> {
  const mappings = await loadMappings();

  const found = mappings.find(
    (m: NickMapping) => m.ocr.toLowerCase() === raw.toLowerCase()
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
// 🔍 FUZZY MATCH
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
// 🔧 SIMILARITY
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