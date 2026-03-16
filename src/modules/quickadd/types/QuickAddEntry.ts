// src/modules/quickadd/types/QuickAddEntry.ts
export type QuickAddEntryStatus = "OK" | "DUPLICATE" | "INVALID" | "UNREADABLE";

export interface QuickAddEntry {
  lineId: number;
  rawText: string;
  nickname: string;
  value: string; // points / donations / raid score as text
  status: QuickAddEntryStatus;
  confidence: number; // OCR confidence (0-100)
}