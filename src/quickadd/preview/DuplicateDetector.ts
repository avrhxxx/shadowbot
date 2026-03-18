import { QuickAddEntry } from "../types/QuickAddEntry";
import { normalizeNickname } from "../utils/nicknameNormalizer";

export class DuplicateDetector {
  static markDuplicates(entries: QuickAddEntry[]) {
    const seen = new Map<string, QuickAddEntry>();
    for (const entry of entries) {
      const normNick = normalizeNickname(entry.nickname);
      if (seen.has(normNick)) {
        entry.status = "DUPLICATE";
      } else {
        seen.set(normNick, entry);
      }
    }
  }
}