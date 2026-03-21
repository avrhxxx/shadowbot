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

  // 🔥 WATCHDOG
  watchdogInterval?: NodeJS.Timeout;
}

export class SessionManager {
  private static sessions = new Map<string, QuickAddSession>();

  private static sendMessage: (channelId: string, content: string) => void = () => {};
  private static deleteChannel: (channelId: string) => void = () => {};

  private static DEBUG = true;

  static setHandlers(handlers: {
    sendMessage: (channelId: string, content: string) => void;
    deleteChannel: (channelId: string) => void;
  }) {
    this.sendMessage = handlers.sendMessage;
    this.deleteChannel = handlers.deleteChannel;
  }

  // =====================================
  // 🚀 CREATE SESSION
  // =====================================
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

    this.startWatchdog(session.guildId); // 🔥 WATCHDOG START
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

  // =====================================
  // 🔥 TOUCH (CENTRALNY RESET)
  // =====================================
  static touch(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.lastActivity = Date.now();

    if (this.DEBUG) {
      console.log(`🟢 [WATCHDOG] touch → ${guildId}`);
    }

    this.resetTimeout(guildId);
  }

  // =====================================
  // 🧠 WATCHDOG SYSTEM
  // =====================================
  private static startWatchdog(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.watchdogInterval = setInterval(() => {
      const now = Date.now();
      const diff = now - session.lastActivity;

      if (this.DEBUG) {
        console.log(
          `🐶 [WATCHDOG] ${guildId} | inactive: ${Math.floor(diff / 1000)}s`
        );
      }

      // 🔥 HARD SAFETY (np. jak timeout padnie)
      if (diff > 10 * 60 * 1000) {
        console.log(`💀 [WATCHDOG] FORCE CLOSE ${guildId}`);

        this.sendMessage(
          session.channelId,
          "💀 Session force-closed (watchdog safety)."
        );

        this.cleanupSession(session);
        this.deleteChannel(session.channelId);
        this.sessions.delete(guildId);
      }
    }, 30 * 1000); // co 30s
  }

  // =====================================
  // 🧹 CLEANUP
  // =====================================
  private static cleanupSession(session: QuickAddSession) {
    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);
    if (session.buffer.timer) clearTimeout(session.buffer.timer);
    if (session.watchdogInterval) clearInterval(session.watchdogInterval);

    session.buffer.ocrResults = [];
  }

  // =====================================
  // ⏱️ TIMEOUT SYSTEM (AUTO-EXTEND)
  // =====================================
  static resetTimeout(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    const INACTIVITY_LIMIT = 3 * 60 * 1000;

    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);

    // ⚠️ WARNING
    session.warningTimeout = setTimeout(() => {
      const now = Date.now();
      const diff = now - session.lastActivity;

      if (diff < 2 * 60 * 1000) return;

      this.sendMessage(
        session.channelId,
        "⚠️ Session inactive. Closing in 60 seconds."
      );
    }, 2 * 60 * 1000);

    // ❌ CLOSE / AUTO-EXTEND
    session.timeout = setTimeout(() => {
      const now = Date.now();
      const diff = now - session.lastActivity;

      // 🔁 AUTO-EXTEND
      if (diff < INACTIVITY_LIMIT) {
        if (this.DEBUG) {
          console.log(`🔁 [WATCHDOG] auto-extend ${guildId}`);
        }
        this.resetTimeout(guildId);
        return;
      }

      this.sendMessage(
        session.channelId,
        "❌ Session closed due to inactivity."
      );

      this.cleanupSession(session);
      this.deleteChannel(session.channelId);
      this.sessions.delete(guildId);
    }, INACTIVITY_LIMIT);
  }

  // =====================================
  // 🛑 END SESSION
  // =====================================
  static endSession(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    this.cleanupSession(session);
    this.sessions.delete(guildId);
  }
}