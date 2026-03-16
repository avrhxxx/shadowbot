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

  /** Dodaje wpis do bufora sesji */
  public addEntry(entry: QuickAddEntry) {
    this.previewBuffer.addEntry(entry);
    this.state = QuickAddSessionState.COLLECTING_DATA;
  }

  /** Pobiera wszystkie wpisy z bufora */
  public getEntries(): QuickAddEntry[] {
    return this.previewBuffer.getEntries();
  }

  /** Pobiera bufor dla komend typu preview */
  public getPreviewBuffer(): QuickAddEntry[] {
    return this.previewBuffer.getEntries();
  }

  /** Poprawia konkretną linię w buforze */
  public adjustLine(index: number, value: string): boolean {
    const entry = this.previewBuffer.getEntries()[index];
    if (!entry) return false;
    entry.value = value;
    return true;
  }

  /** Czyści preview (redo) */
  public clearPreview(): void {
    this.previewBuffer.clear();
  }

  /** Naprawia konkretny wpis (repair) */
  public repairError(index: number, correction: string): boolean {
    const entry = this.previewBuffer.getEntries()[index];
    if (!entry) return false;
    entry.value = correction;
    return true;
  }

  /** Potwierdza dane i zapisuje je w serwisach */
  public async confirmPreview(): Promise<void> {
    await QuickAddService.persistBuffer(this.previewBuffer.getEntries());
    this.state = QuickAddSessionState.CONFIRMED;
  }

  /** Anuluje sesję */
  public cancel(): void {
    this.previewBuffer.clear();
    this.state = QuickAddSessionState.CANCELLED;
  }
}

/** Menadżer sesji QuickAdd, singleton */
export class QuickAddSessionManager {
  private static instance: QuickAddSessionManager;
  private quickAddChannelId: string | null = null;
  private activeSession: QuickAddSession | null = null;

  private constructor() {}

  public static getInstance(): QuickAddSessionManager {
    if (!QuickAddSessionManager.instance) {
      QuickAddSessionManager.instance = new QuickAddSessionManager();
    }
    return QuickAddSessionManager.instance;
  }

  public registerQuickAddChannel(channelId: string) {
    this.quickAddChannelId = channelId;
  }

  public isQuickAddChannel(channelId: string): boolean {
    return this.quickAddChannelId === channelId;
  }

  public hasActiveSession(): boolean {
    return this.activeSession !== null;
  }

  public startSession(session: QuickAddSession): boolean {
    if (this.activeSession) return false;
    if (!this.quickAddChannelId || session.channelId !== this.quickAddChannelId) return false;
    this.activeSession = session;
    return true;
  }

  public getActiveSession(): QuickAddSession | null {
    return this.activeSession;
  }

  public endSession(): void {
    this.activeSession = null;
  }

  /** Tworzy nową sesję i ustawia ją jako aktywną */
  public createSession(options: {
    guildId: string;
    moderatorId: string;
    eventType: string;
    date: string;
    parser: any;
  }): QuickAddSession {
    const sessionId = `${options.guildId}-${Date.now()}`;
    const session = new QuickAddSession(sessionId, options.moderatorId, this.quickAddChannelId!);
    this.activeSession = session;
    return session;
  }
}