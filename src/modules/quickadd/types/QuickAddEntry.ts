export interface QuickAddEntry {
  lineId: number;       // numer linii w preview buffer
  rawText: string;      // surowy tekst z OCR lub manualnego inputu
  nickname: string;     // wyekstrahowany nick
  value: string;        // wartość punktowa/donacji/raid score w formacie tekstowym
  status: 'OK' | 'DUPLICATE' | 'INVALID' | 'UNREADABLE';
  confidence?: number;  // opcjonalny poziom pewności OCR
}