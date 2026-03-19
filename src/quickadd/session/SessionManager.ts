// src/quickadd/session/SessionManager.ts

export type SessionMode = "add" | "attend" | "auto";

export type ParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS";

// 🔹 dane pojedynczego wpisu
export interface SessionEntry {
  nickname: string;
  value: number;
  raw: string;
}

interface QuickAddSession {
  guildId: string;
  channelId: string;
  moderatorId: string;

  mode: SessionMode;

  // 🔥 AUTO → nie znamy jeszcze typu
  parserType: ParserType | null;

  // 🔥 przyszłość (select menu)
  eventId?: string;
  week?: string;

  entries: SessionEntry[];
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  // 🔥 tworzenie sesji (AUTO kompatybilne)
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