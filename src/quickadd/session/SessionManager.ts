// src/quickadd/session/SessionManager.ts

export type SessionMode = "add" | "attend" | "auto";

export type ParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS";

export interface SessionEntry {
  nickname: string;
  value: number;
  raw: string;
}

// 🔥 NOWY TYP (KLUCZOWY)
export interface OCRBatchItem {
  lines: string[];
  traceId: string;
}

interface QuickAddSession {
  guildId: string;
  channelId: string;
  moderatorId: string;

  mode: SessionMode;
  parserType: ParserType | null;

  eventId?: string;
  week?: string;

  entries: SessionEntry[];

  // 🔥 FIXED BUFFER
  buffer: {
    ocrResults: OCRBatchItem[];
    timer?: NodeJS.Timeout;
  };

  lastActivity: number;
  timeout?: NodeJS.Timeout;
  warningTimeout?: NodeJS.Timeout;
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  private static sendMessage: (channelId: string, content: string) => void = () => {};
  private static deleteChannel: (channelId: string) => void = () => {};

  static setHandlers(handlers: {
    sendMessage: (channelId: string, content: string) => void;
    deleteChannel: (channelId: string) => void;
  }) {
    this.sendMessage = handlers.sendMessage;
    this.deleteChannel = handlers.deleteChannel;
  }

  static createSession(
    session: Omit<QuickAddSession, "entries" | "lastActivity" | "buffer">
  ) {
    const newSession: QuickAddSession = {
      ...session,
      entries: [],
      lastActivity: Date.now(),

      buffer: {
        ocrResults: [],
      },
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

  static touch(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.lastActivity = Date.now();
    this.resetTimeout(guildId);
  }

  // =====================================
  // 🔥 FULL CLEANUP (NOWE)
  // =====================================
  private static cleanupSession(session: QuickAddSession) {
    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);
    if (session.buffer.timer) clearTimeout(session.buffer.timer);

    session.buffer.ocrResults = [];
  }

  static resetTimeout(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);

    session.warningTimeout = setTimeout(() => {
      this.sendMessage(
        session.channelId,
        "⚠️ Session inactive. Closing in 60 seconds."
      );
    }, 2 * 60 * 1000);

    session.timeout = setTimeout(() => {
      this.sendMessage(
        session.channelId,
        "❌ Session closed due to inactivity."
      );

      this.cleanupSession(session); // 🔥 FIX
      this.deleteChannel(session.channelId);
      this.sessions.delete(guildId);
    }, 3 * 60 * 1000);
  }

  static endSession(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    this.cleanupSession(session); // 🔥 FIX
    this.sessions.delete(guildId);
  }
}