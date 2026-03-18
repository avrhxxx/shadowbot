import { QuickAddEntry } from "../types/QuickAddEntry";
import { normalizeNickname } from "../utils/nicknameNormalizer";

export class PreviewBuffer {
  private entries: QuickAddEntry[] = [];
  private nextLineId: number = 1;

  addEntry(entry: Omit<QuickAddEntry, "lineId">) {
    const newEntry: QuickAddEntry = {
      lineId: this.nextLineId++,
      ...entry
    };
    this.entries.push(newEntry);
    return newEntry;
  }

  getAllEntries(): QuickAddEntry[] {
    return [...this.entries];
  }

  adjustEntry(lineId: number, data: Partial<Pick<QuickAddEntry, "nickname" | "value">>) {
    const entry = this.entries.find(e => e.lineId === lineId);
    if (!entry) return null;
    if (data.nickname !== undefined) entry.nickname = data.nickname;
    if (data.value !== undefined) entry.value = data.value;
    return entry;
  }

  markDuplicate(lineId: number) {
    const entry = this.entries.find(e => e.lineId === lineId);
    if (entry) entry.status = "DUPLICATE";
  }

  reset() {
    this.entries = [];
    this.nextLineId = 1;
  }

  confirm(): QuickAddEntry[] {
    const confirmed = [...this.entries];
    this.reset();
    return confirmed;
  }
}