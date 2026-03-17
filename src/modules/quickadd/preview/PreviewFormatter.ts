// src/modules/quickadd/preview/PreviewFormatter.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

/**
 * Formatuje preview do wyświetlenia na Discordzie
 */
export function formatPreview(entries: QuickAddEntry[]): string {
  if (entries.length === 0) {
    return "Brak danych do wyświetlenia.";
  }

  return entries
    .map((entry) => {
      let statusIcon = "";

      switch (entry.status) {
        case "DUPLICATE":
          statusIcon = "⚠️";
          break;
        case "INVALID":
          statusIcon = "❌";
          break;
        case "UNREADABLE":
          statusIcon = "❓";
          break;
        default:
          statusIcon = "✅";
      }

      return `[${entry.lineId}] ${entry.nickname} – ${entry.value} ${statusIcon}`;
    })
    .join("\n");
}