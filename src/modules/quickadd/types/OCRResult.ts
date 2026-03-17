export interface OCRResult {
  rowId: number;          // numer wiersza w screenshotcie
  rawText: string;        // surowy tekst rozpoznany przez OCR
  confidence: number;     // procent pewności OCR
  status: "OK" | "UNREADABLE"; // status weryfikacji wstępnej
}