// src/quickadd/types/QuickAddEntry.ts

export type QuickAddEntryStatus =
  | "OK"
  | "DUPLICATE"
  | "INVALID"
  | "UNREADABLE"
  | "ORPHAN"; // 🔥 brakujący status (value bez nicku)

export interface QuickAddEntry {
  lineId?: number;

  nickname: string;

  value: number; // zostaje (dla kompatybilności)

  raw: string;

  rawText?: string;

  status?: QuickAddEntryStatus;
  confidence?: number;

  // 🔥 ROZSZERZONE O AI
  sourceType?: "OCR" | "MANUAL" | "AI";

  // 🔥 NOWE POLE
  group?: "MAIN" | "RESERVE";
}