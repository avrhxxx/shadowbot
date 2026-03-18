import { SessionManager } from "./SessionManager";
import { QuickAddSession } from "./QuickAddSession";

export class TimeoutManager {
  private static instance: TimeoutManager;
  private intervalId: NodeJS.Timer | null = null;
  private warningSent: Set<string> = new Set();

  private constructor() {}

  static getInstance(): TimeoutManager {
    if (!this.instance) this.instance = new TimeoutManager();
    return this.instance;
  }

  start(intervalMs = 10000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.checkSessions(), intervalMs);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private checkSessions() {
    const now = Date.now();
    const sessions = SessionManager.getInstance().getAllSessions();
    for (const session of sessions) {
      const elapsed = now - session.lastActivity;
      const guildId = session.guildId;

      if (elapsed > 3 * 60_000) { // 3 min timeout
        session.previewBuffer.clear();
        SessionManager.getInstance().endSession(guildId);
        this.warningSent.delete(guildId);
        console.log(`Session ${guildId} closed due to inactivity.`);
      } else if (elapsed > 2 * 60_000) { // 2 min warning
        if (!this.warningSent.has(guildId)) {
          console.log(`⚠️ Session ${guildId} inactive. Closing in 60 seconds.`);
          this.warningSent.add(guildId);
        }
      }
    }
  }

  touchSession(guildId: string) {
    const session = SessionManager.getInstance().getSession(guildId);
    if (session) session.touch();
    this.warningSent.delete(guildId);
  }
}