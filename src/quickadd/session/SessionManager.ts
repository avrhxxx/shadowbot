type EventType = "rr" | "dn" | "dp";
type SessionMode = "add" | "attend";

export type ParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS";

// 🔹 dane pojedynczego wpisu (spójne z parserami)
export interface SessionEntry {
  nickname: string;
  value: number;
  raw: string;
}

interface QuickAddSession {
  guildId: string;
  channelId: string;
  moderatorId: string;

  eventType: EventType;
  mode: SessionMode;

  parserType: ParserType;

  entries: SessionEntry[];
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  // 🔥 KLUCZOWA ZMIANA
  static createSession(
    session: Omit<QuickAddSession, "entries">
  ) {
    this.sessions.set(session.guildId, {
      ...session,
      entries: [], // zawsze start pusto
    });
  }

  static getSession(guildId: string) {
    return this.sessions.get(guildId);
  }

  static hasSession(guildId: string) {
    return this.sessions.has(guildId);
  }

  // 🔥 TYPY zamiast any
  static addEntries(guildId: string, newEntries: SessionEntry[]) {
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