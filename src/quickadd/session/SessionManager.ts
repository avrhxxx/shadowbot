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

  buffer: {
    ocrResults: OCRBatchItem[];
    timer?: NodeJS.Timeout;
  };

  lastActivity: number;
  timeout?: NodeJS.Timeout;
  warningTimeout?: NodeJS.Timeout;

  // 🔥 TOKEN (anty race condition)
  activityToken?: number;
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  private static sendMessage: (channelId: string, content: string) => void = () => {};
  private static deleteChannel: (channelId: string) => void = () => {};

  // 🔥 KONFIG (łatwo zmienić)
  private static WARNING_TIME = 2 * 60 * 1000; // 2 min
  private static TIMEOUT_TIME = 3 * 60 * 1000; // 3 min
  private static EXTEND_STEP = 60 * 1000; // +1 min za aktywność
  private static MAX_TIME = 10 * 60 * 1000; // max 10 min

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
      activityToken: Date.now(),

      buffer: {
        ocrResults: [],
      },
    };

    this.sessions.set(session.guildId, newSession);

    this.resetTimeout(session.guildId, true);
  }

  static getSession(guildId: string) {
    const session = this.sessions.get(guildId);
    if (session) this.touch(guildId); // 🔥 auto extend
    return session;
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
    this.touch(guildId);
  }

  static touch(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.lastActivity = Date.now();
    session.activityToken = session.lastActivity;

    this.resetTimeout(guildId);
  }

  // =====================================
  // 🔥 CLEANUP
  // =====================================
  private static cleanupSession(session: QuickAddSession) {
    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);
    if (session.buffer.timer) clearTimeout(session.buffer.timer);

    session.buffer.ocrResults = [];
  }

  // =====================================
  // 🔥 AUTO-EXTEND TIMEOUT SYSTEM
  // =====================================
  static resetTimeout(guildId: string, initial = false) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);

    // 🔥 dynamiczne wydłużanie
    let timeoutTime = this.TIMEOUT_TIME;

    if (!initial) {
      const elapsed = Date.now() - session.lastActivity;

      timeoutTime = Math.min(
        this.TIMEOUT_TIME + this.EXTEND_STEP,
        this.MAX_TIME
      );
    }

    const warningTime = timeoutTime - 60 * 1000;

    const token = session.activityToken;

    // ⚠️ WARNING
    session.warningTimeout = setTimeout(() => {
      const s = this.sessions.get(guildId);
      if (!s || s.activityToken !== token) return;

      this.sendMessage(
        s.channelId,
        "⚠️ Session inactive. Closing in 60 seconds."
      );
    }, warningTime);

    // ❌ FINAL CLOSE
    session.timeout = setTimeout(() => {
      const s = this.sessions.get(guildId);
      if (!s || s.activityToken !== token) return;

      this.sendMessage(
        s.channelId,
        "❌ Session closed due to inactivity."
      );

      this.cleanupSession(s);
      this.deleteChannel(s.channelId);
      this.sessions.delete(guildId);
    }, timeoutTime);
  }

  static endSession(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    this.cleanupSession(session);
    this.sessions.delete(guildId);
  }
}