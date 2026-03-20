// src/quickadd/services/QuickAddNicknameService.ts

import { readSheet, appendQuickAddRows } from "../../googleSheetsStorage";

const TYPE = "nickname";

interface NickMapping {
  ocr: string;
  final: string;
  override?: string;
  createdAt: number;
}

let cache: NickMapping[] | null = null;

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

    // 🔥 anty-śmieci
    if (raw.length < 3) continue;
    if (/donat/i.test(raw)) continue;

    if (raw.toLowerCase() === final.toLowerCase()) continue;

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

  await appendQuickAddRows(rowsToAppend);

  cache = null;

  console.log(`✅ Saved ${rowsToAppend.length} mappings`);
}

export async function resolveNickname(raw: string): Promise<string>