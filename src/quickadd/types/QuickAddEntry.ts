//

export type QuickAddEntryStatus =
  | "OK"
  | "DUPLICATE"
  | "INVALID"
  | "UNREADABLE";

export interface QuickAddEntry {
  lineId?: number;

  nickname: string;

  value: number; // zostaje (dla kompatybilności)

  raw: string;

  rawText?: string;

  status?: QuickAddEntryStatus;
  confidence?: number;
  sourceType?: "OCR" | "MANUAL";

  // 🔥 NOWE POLE
  group?: "MAIN" | "RESERVE";
}