// src/quickadd/session/SessionManager.ts

type EventType = "rr" | "dn" | "dp";
export type SessionMode = "add" | "attend" | "auto"; // 🔥 AUTO DODANE

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

  parserType: ParserType | null; // 🔥 AUTO = null

  entries: SessionEntry[];
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  // 🔥 KLUCZOWA ZMIANA (parserType może być null)
  static createSession(
    session: Omit<QuickAddSession, "entries">
  ) {
    this.sessions.set(session.guildId, {
      ...session,
      entries: [],
    });
  }

  static getSession(guildId: string) {
    return this.sessions.get(guildId);
  }

  static hasSession(guildId: string) {
    return this.sessions.has(guildId);
  }

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