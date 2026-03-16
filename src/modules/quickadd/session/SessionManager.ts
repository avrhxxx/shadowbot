import { QuickAddSession } from "./QuickAddSession";

export class QuickAddSessionManager {
  private static instance: QuickAddSessionManager;

  // Zarejestrowany kanał do startu sesji
  private quickAddChannelId: string | null = null;

  // Aktywna sesja
  private activeSession: QuickAddSession | null = null;

  private constructor() {}

  public static getInstance(): QuickAddSessionManager {
    if (!QuickAddSessionManager.instance) {
      QuickAddSessionManager.instance = new QuickAddSessionManager();
    }
    return QuickAddSessionManager.instance;
  }

  /** Rejestruje kanał startowy #quickadd */
  public registerQuickAddChannel(channelId: string) {
    this.quickAddChannelId = channelId;
  }

  /** Sprawdza, czy dany kanał jest kanałem QuickAdd */
  public isQuickAddChannel(channelId: string): boolean {
    return this.quickAddChannelId === channelId;
  }

  /** Rozpoczyna nową sesję, jeśli nie ma aktywnej i komenda jest w kanale QuickAdd */
  public startSession(session: QuickAddSession): boolean {
    if (this.activeSession) return false; // już jest sesja
    if (!this.quickAddChannelId || session.channelId !== this.quickAddChannelId) return false;
    this.activeSession = session;
    return true;
  }

  /** Zwraca aktywną sesję */
  public getActiveSession(): QuickAddSession | null {
    return this.activeSession;
  }

  /** Kończy sesję */
  public endSession(): void {
    this.activeSession = null;
  }

  /** Sprawdza, czy jest aktywna sesja */
  public hasActiveSession(): boolean {
    return this.activeSession !== null;
  }
}