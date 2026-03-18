type EventType = "rr" | "dn" | "dp";
type SessionMode = "add" | "attend";

export type ParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS";

interface QuickAddSession {
  guildId: string;
  channelId: string;
  moderatorId: string;

  // Twój system (zostaje)
  eventType: EventType;
  mode: SessionMode;

  // 🔥 NOWE - KLUCZ DO PARSERÓW
  parserType: ParserType;

  // 🔥 dane z OCR / parsera
  entries: {
    nickname: string;
    value?: number;
  }[];
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  static createSession(session: QuickAddSession) {
    this.sessions.set(session.guildId, {
      ...session,
      entries: [], // 🔥 zawsze startuje puste
    });
  }

  static getSession(guildId: string) {
    return this.sessions.get(guildId);
  }

  static hasSession(guildId: string) {
    return this.sessions.has(guildId);
  }

  static addEntries(guildId: string, newEntries: any[]) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.entries.push(...newEntries);
  }

  static clearEntries(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.entries = [];
  }

  static endSession(guildId: string) {
    this.sessions.delete(guildId);
  }
}