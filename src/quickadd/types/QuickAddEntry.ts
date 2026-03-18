export type QuickAddEntryStatus =
  | "OK"
  | "DUPLICATE"
  | "INVALID"
  | "UNREADABLE";

export interface QuickAddEntry {
  lineId?: number; // opcjonalne (OCR może, manual nie musi)

  nickname: string;

  value: number; // 🔥 zawsze number (kluczowe dla merge/sum)

  raw: string; // 🔥 to pokazujesz w preview (np. "25.5M", "82,000")

  rawText?: string; // 🔥 DEBUG OCR (CAŁA linia z obrazka)

  status?: QuickAddEntryStatus;
  confidence?: number;
  sourceType?: "OCR" | "MANUAL";
}