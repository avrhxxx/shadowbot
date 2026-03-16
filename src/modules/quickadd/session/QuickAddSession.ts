import { QuickAddEntry } from "../types/QuickAddEntry";
import { PreviewBuffer } from "../preview/PreviewBuffer";
import { QuickAddService } from "../services/QuickAddService";

export type SessionStatus =
  | "INIT"
  | "COLLECTING_DATA"
  | "PREVIEW_READY"
  | "CONFIRMED"
  | "CANCELLED"
  | "TIMEOUT";

export class QuickAddSession {
  public readonly sessionId: string;
  public state: SessionStatus;
  public readonly moderatorId: string;
  public readonly channelId: string;
  private previewBuffer: PreviewBuffer;

  constructor(sessionId: string, moderatorId: string, channelId: string) {
    this.sessionId = sessionId;
    this.moderatorId = moderatorId;
    this.channelId = channelId;
    this.state = "INIT";
    this.previewBuffer = new PreviewBuffer();
  }

  /** Dodaje wpis do bufora sesji */
  public addEntry(entry: QuickAddEntry) {
    this.previewBuffer.add(entry);
    this.state = "COLLECTING_DATA";
  }

  /** Pobiera wszystkie wpisy z bufora */
  public getEntries(): QuickAddEntry[] {
    return this.previewBuffer.getAll();
  }

  /** Potwierdzenie i zapis do serwisów */
  public async confirmPreview(): Promise<void> {
    await QuickAddService.persistBuffer(this.previewBuffer.getAll());
    this.state = "CONFIRMED";
  }

  /** Czyści sesję i bufor */
  public cancel(): void {
    this.previewBuffer.clear();
    this.state = "CANCELLED";
  }

  /** Czyści bufor (np. dla /redo) */
  public clearPreview(): void {
    this.previewBuffer.clear();
    this.state = "COLLECTING_DATA";
  }

  /** Naprawia wpis w buforze (np. dla /adjust lub /repair) */
  public repairEntry(lineIndex: number, newValue: string): boolean {
    const entries = this.previewBuffer.getAll();
    if (lineIndex < 0 || lineIndex >= entries.length) return false;
    entries[lineIndex].value = newValue;
    this.previewBuffer.replaceAll(entries);
    return true;
  }
}