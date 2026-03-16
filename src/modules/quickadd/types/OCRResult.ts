export interface OCRResult {
    rawText: string;        // Tekst wyciągnięty z OCR
    confidence: number;     // Pewność OCR w %
    lineId?: number;        // Opcjonalny identyfikator linii
}