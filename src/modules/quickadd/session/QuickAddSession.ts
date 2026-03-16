// src/modules/quickadd/session/QuickAddSession.ts

import { QuickAddEntry } from "../types/QuickAddEntry";
import { QuickAddSessionState } from "../types/QuickAddSessionState";
import { PreviewBuffer } from "../preview/PreviewBuffer";
import { QuickAddService } from "../services/QuickAddService";

export class QuickAddSession {
  public readonly sessionId: string;
  public state: QuickAddSessionState;
  public readonly moderatorId: string;
  public readonly channelId: string;
  private previewBuffer: PreviewBuffer;

  constructor(sessionId: string, moderatorId: string, channelId: string) {
    this.sessionId = sessionId;
    this.moderatorId = moderatorId;
    this.channelId = channelId;
    this.state = QuickAddSessionState.INIT;
    this.previewBuffer = new PreviewBuffer();
  }

  // Dodaje wpis do bufora sesji
  public addEntry(entry: QuickAddEntry) {
    this.previewBuffer.addEntry(entry);
    this.state = QuickAddSessionState.COLLECTING_DATA;
  }

  // Pobiera wszystkie wpisy z bufora
  public getEntries(): QuickAddEntry[] {
    return this.previewBuffer.getEntries();
  }

  // Potwierdzenie i zapis do serwisów
  public async confirm(): Promise<void> {
    await QuickAddService.persistBuffer(this.previewBuffer.getEntries());
    this.state = QuickAddSessionState.CONFIRMED;
  }

  // Czyści sesję i bufor
  public cancel(): void {
    this.previewBuffer.clear();
    this.state = QuickAddSessionState.CANCELLED;
  }
}