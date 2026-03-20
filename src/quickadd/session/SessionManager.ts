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

  // ⏱️ timeout system (blueprint)
  lastActivity: number;
  timeout?: NodeJS.Timeout;
  warningTimeout?: NodeJS.Timeout;
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  // 🔌 handlers (bez zależności od Discorda)
  private static sendMessage: (channelId: string, content: string) => void = () => {};
  private static deleteChannel: (channelId: string) => void = () => {};

  static setHandlers(handlers: {
    sendMessage: (channelId: string, content: string) => void;
    deleteChannel: (channelId: string) => void;
  }) {
    this.sendMessage = handlers.sendMessage;
    this.deleteChannel = handlers.deleteChannel;
  }

  // 🔥 tworzenie sesji
  static createSession(
    session: Omit<QuickAddSession, "entries" | "lastActivity">
  ) {
    const newSession: QuickAddSession = {
      ...session,
      entries: [],
      lastActivity: Date.now(),
    };

    this.sessions.set(session.guildId, newSession);

    this.resetTimeout(session.guildId);
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
    this.touch(guildId);
  }

  static clearEntries(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.entries = [];
  }

  // 🔁 reset aktywności
  static touch(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.lastActivity = Date.now();
    this.resetTimeout(guildId);
  }

  // ⏱️ timeout logic (2min warning / 3min kill)
  static resetTimeout(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);

    // ⚠️ warning
    session.warningTimeout = setTimeout(() => {
      this.sendMessage(
        session.channelId,
        "⚠️ Session inactive. Closing in 60 seconds."
      );
    }, 2 * 60 * 1000);

    // 🔴 kill
    session.timeout = setTimeout(() => {
      this.sendMessage(
        session.channelId,
        "❌ Session closed due to inactivity."
      );

      this.deleteChannel(session.channelId);
      this.sessions.delete(guildId);
    }, 3 * 60 * 1000);
  }

  // 🧹 cleanup
  static endSession(guildId: string) {
    const session = this.sessions.get(guildId);

    if (session?.timeout) clearTimeout(session.timeout);
    if (session?.warningTimeout) clearTimeout(session.warningTimeout);

    this.sessions.delete(guildId);
  }
}