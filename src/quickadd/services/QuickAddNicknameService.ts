// src/quickadd/services/QuickAddNicknameService.ts
import { SheetRepository } from "../../google/SheetRepository";

const TYPE = "nickname";

// =============================
// TYPES
// =============================
interface NickMapping {
  id?: string;
  type: string;
  ocr: string;
  final: string;
  override?: string;
  createdAt: number;
}

// =============================
// 📦 REPO
// =============================
const repo = new SheetRepository<NickMapping>("quickadd");

let cache: NickMapping[] | null = null;

// =============================
// 📥 LOAD
// =============================
async function loadMappings(): Promise<NickMapping[]> {
  if (cache) return cache;

  const all = await repo.findAll();

  const filtered = all
    .filter((r) => r.type === TYPE && r.ocr)
    .map((r) => ({
      ...r,
      ocr: r.ocr.trim(),
      final: r.final?.trim() || "",
      override: r.override?.trim() || "",
      createdAt: r.createdAt || 0,
    }));

  cache = filtered;
  return filtered;
}

// =============================
// 💾 SAVE
// =============================
export async function saveNickMappings(
  entries: { nickname: string; raw: string }[]
) {
  console.log("🧠 [NickService] Saving mappings...");

  const now = Date.now();
  let saved = 0;

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

    await repo.create({
      type: TYPE,
      ocr: raw,
      final,
      override: "",
      createdAt: now,
    });

    saved++;
  }

  if (!saved) {
    console.log("⚠️ No mappings to save");
    return;
  }

  cache = null;

  console.log(`✅ Saved ${saved} mappings`);
}

// =============================
// 🔍 EXACT RESOLVE
// =============================
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

// =============================
// 🔍 FUZZY
// =============================
export async function resolveNicknameFuzzy(raw: string): Promise<string> {
  const mappings = await loadMappings();

  let best: { score: number; value: string } | null = null;

  for (const m of mappings) {
    const score = similarity(raw, m.ocr);

    if (score > 0.8 && (!best || score > best.score)) {
      const value = m.override || m.final;
      if (!value) continue;

      best = { score, value };
    }
  }

  if (best) {
    console.log(`🧠 FUZZY RESOLVE: ${raw} → ${best.value}`);
    return best.value;
  }

  return raw;
}

// =============================
// 🔧 SIMILARITY
// =============================
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