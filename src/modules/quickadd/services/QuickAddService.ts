// src/modules/quickadd/services/QuickAddService.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export class QuickAddService {
  /** Zapisuje pojedynczy wpis */
  public static async persistEntry(entry: QuickAddEntry): Promise<void> {
    // Tu przykładowa logika zapisu – możesz podpiąć swój serwis
    console.log(`Persisting QuickAdd entry: ${entry.nickname} -> ${entry.value} [${entry.status}]`);
    // W przyszłości możesz tu wywołać:
    // pointsService.addPoints(...) lub eventService.addEventEntry(...)
  }

  /** Zapisuje cały bufor */
  public static async persistBuffer(entries: QuickAddEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.persistEntry(entry);
    }
  }
}