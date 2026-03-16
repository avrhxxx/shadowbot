// src/modules/quickadd/session/TimeoutManager.ts

import { QuickAddSession } from "./QuickAddSession";

export class TimeoutManager {
  private session: QuickAddSession;
  private warningTimer: NodeJS.Timeout | null = null;
  private closeTimer: NodeJS.Timeout | null = null;

  private readonly WARNING_DELAY = 2 * 60 * 1000; // 2 min
  private readonly CLOSE_DELAY = 3 * 60 * 1000;   // 3 min

  constructor(session: QuickAddSession) {
    this.session = session;
    this.resetTimers();
  }

  // Resetuje timery przy każdej aktywności
  public resetTimers() {
    this.clearTimers();

    this.warningTimer = setTimeout(() => {
      this.session.notify("⚠️ Session inactive. Closing in 60 seconds.");
    }, this.WARNING_DELAY);

    this.closeTimer = setTimeout(() => {
      this.session.terminate("Timeout due to inactivity");
    }, this.CLOSE_DELAY);
  }

  // Czyści timery
  private clearTimers() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  // Zatrzymuje timery przy zakończeniu sesji
  public stop() {
    this.clearTimers();
  }
}