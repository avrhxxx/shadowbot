type EventType = "rr" | "dn" | "dp";
type SessionMode = "add" | "attend";

interface QuickAddSession {
  guildId: string;
  channelId: string;
  moderatorId: string;
  eventType: EventType;
  mode: SessionMode;
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  static createSession(session: QuickAddSession) {
    this.sessions.set(session.guildId, session);
  }

  static getSession(guildId: string) {
    return this.sessions.get(guildId);
  }

  static hasSession(guildId: string) {
    return this.sessions.has(guildId);
  }

  static endSession(guildId: string) {
    this.sessions.delete(guildId);
  }
}