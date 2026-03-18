export type QuickAddEntryStatus =
  | "OK"
  | "DUPLICATE"
  | "INVALID"
  | "UNREADABLE";

export interface QuickAddEntry {
  lineId?: number; // 🔥 opcjonalne (parsery nie muszą tego dawać)

  nickname: string;

  value: number; // 🔥 ZAMIANA string → number

  raw: string; // 🔥 ZAMIANA rawText → raw

  status?: QuickAddEntryStatus; // 🔥 opcjonalne (na przyszłość)
  confidence?: number;          // 🔥 opcjonalne
  sourceType?: "OCR" | "MANUAL";
}