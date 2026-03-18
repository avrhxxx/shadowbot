export type QuickAddEntryStatus = "OK" | "DUPLICATE" | "INVALID" | "UNREADABLE";

export interface QuickAddEntry {
  lineId: number;
  rawText: string;
  nickname: string;
  value: string;
  status: QuickAddEntryStatus;
  confidence: number;
  sourceType?: "OCR" | "MANUAL";
}