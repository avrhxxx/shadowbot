// src/modules/quickadd/preview/PreviewBuffer.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export class PreviewBuffer {
  private entries: QuickAddEntry[] = [];

  /**
   * Dodaje pojedynczy wpis do preview
   */
  addEntry(entry: QuickAddEntry): void {
    this.entries.push(entry);
  }

  /**
   * Dodaje wiele wpisów naraz (np. z OCR)
   */
  addEntries(entries: QuickAddEntry[]): void {
    this.entries.push(...entries);
  }

  /**
   * Zwraca wszystkie wpisy
   */
  getEntries(): QuickAddEntry[] {
    return this.entries;
  }

  /**
   * Czyści cały buffer (np. !redo)
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Liczba wpisów
   */
  size(): number {
    return this.entries.length;
  }
}