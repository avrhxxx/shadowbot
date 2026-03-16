// src/modules/quickadd/session/SessionManager.ts

import { QuickAddSession } from "./QuickAddSession";

export class SessionManager {
  private static instance: SessionManager;
  private activeSession: QuickAddSession | null = null;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Rozpoczyna nową sesję, jeśli nie ma aktywnej
  public startSession(session: QuickAddSession): boolean {
    if (this.activeSession) return false; // już jest sesja
    this.activeSession = session;
    return true;
  }

  // Zwraca aktywną sesję
  public getActiveSession(): QuickAddSession | null {
    return this.activeSession;
  }

  // Kończy sesję
  public endSession(): void {
    this.activeSession = null;
  }

  // Sprawdza, czy jest aktywna sesja
  public hasActiveSession(): boolean {
    return this.activeSession !== null;
  }
}