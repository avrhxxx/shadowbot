import { QuickAddEntry } from "../types/QuickAddEntry";

export class PreviewFormatter {
  static format(entries: QuickAddEntry[]): string {
    return entries
      .map(e => {
        const statusTag = e.status === "DUPLICATE" ? "⚠️ DUPLICATE" :
                          e.status === "INVALID" ? "❌ INVALID" :
                          e.status === "UNREADABLE" ? "❓ UNREADABLE" : "✅ OK";
        return `[${e.lineId}] ${e.nickname} → ${e.value} ${statusTag}`;
      })
      .join("\n");
  }
}