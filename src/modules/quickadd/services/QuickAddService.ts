// src/modules/quickadd/services/QuickAddService.ts

import { QuickAddEntry } from "../types/QuickAddEntry";
import * as pointsService from "../../pointsPanel/pointsService";
import * as eventService from "../../eventsPanel/eventService";

export class QuickAddService {
  // Zapisuje wpis QuickAdd do odpowiedniego serwisu
  public static async persistEntry(entry: QuickAddEntry): Promise<void> {
    if (entry.category === "Donations" || entry.category === "Duel") {
      // Przekazanie do pointsService
      await pointsService.addPoints({
        category: entry.category,
        week: entry.week,
        nick: entry.nickname,
        points: entry.value
      });
    } else {
      // Event-specific entries np. Reservoir Raid
      await eventService.addEventEntry({
        eventType: entry.category,
        week: entry.week,
        nickname: entry.nickname,
        value: entry.value
      });
    }
  }

  // Zapisuje cały bufor QuickAdd
  public static async persistBuffer(entries: QuickAddEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.persistEntry(entry);
    }
  }
}