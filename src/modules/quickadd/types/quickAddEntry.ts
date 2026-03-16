// Typ reprezentujący jeden wpis QuickAdd w buforze
export interface QuickAddEntry {
  lineId: number;          // numer w buforze
  rawText: string;         // oryginalny tekst z OCR / manual input
  nickname: string;        // wyekstrahowany nickname (po normalizacji)
  value: string;           // wartość punktów / donation / raid
  status: 'OK' | 'DUPLICATE' | 'INVALID' | 'UNREADABLE'; // status wpisu
  confidence?: number;     // opcjonalnie: wynik OCR w %
}