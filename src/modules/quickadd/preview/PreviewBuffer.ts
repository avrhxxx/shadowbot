/**
 * PreviewBuffer.ts
 *
 * Bufor przechowujący wpisy QuickAdd przed zatwierdzeniem
 */

import { QuickAddEntry } from "../types/QuickAddEntry";

export class PreviewBuffer {
  private entries: QuickAddEntry[] = [];

  /** Dodaje nowy wpis do bufora */
  add(entry: QuickAddEntry) {
    this.entries.push(entry);
  }

  /** Zwraca wszystkie wpisy */
  getAll(): QuickAddEntry[] {
    return [...this.entries];
  }

  /** Czyści bufor */
  clear() {
    this.entries = [];
  }

  /** Zwraca liczbę wpisów w buforze */
  size(): number {
    return this.entries.length;
  }

  /** Zastępuje bufor nowymi wpisami (np. po OCR repair) */
  replaceAll(newEntries: QuickAddEntry[]) {
    this.entries = [...newEntries];
  }
}