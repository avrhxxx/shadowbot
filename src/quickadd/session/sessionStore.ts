// src/quickadd/session/sessionStore.ts

import { parseValue } from "../utils/parseValue";

// =====================================
// TYPES
// =====================================
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
  watchdogInterval?: NodeJS.Timeout;
}

// =====================================
// STORE
// =====================================
export class SessionStore {
  private static sessions = new Map<string, QuickAddSession>();

  private static sendMessage: (channelId: string, content: string) => void = () => {};
  private static deleteChannel: (channelId: string) => void = () => {};

  private static DEBUG = true;

  // =====================================
  // 🧠 NORMALIZE KEY
  // =====================================
  private static normalizeKey(nick: string): string {
    return nick.trim().toLowerCase();
  }

  // =====================================
  // 🧠 MERGE ENGINE (GLOBAL)
  // =====================================
  private static mergeEntries(entries: SessionEntry[]): SessionEntry[] {
    const map = new Map<string, SessionEntry>();

    for (const e of entries) {
      const key = this.normalizeKey(e.nickname);

      if (!key || e.value < 0) continue;

      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...e });
        continue;
      }

      if (e.value > existing.value) {
        map.set(key, { ...e });
      }
    }

    return Array.from(map.values());
  }

  // =====================================
  // HANDLERS
  // =====================================
  static setHandlers(handlers: {
    sendMessage: (channelId: string, content: string) => void;
    deleteChannel: (channelId: string) => void;
  }) {
    this.sendMessage = handlers.sendMessage;
    this.deleteChannel = handlers.deleteChannel;
  }

  // =====================================
  // CREATE SESSION
  // =====================================
  static createSession(
    session: Omit<QuickAddSession, "entries" | "lastActivity" | "buffer">
  ) {
    const newSession: QuickAddSession = {
      ...session,
      entries: [],
      lastActivity: Date.now(),
      buffer: { ocrResults: [] },
    };

    this.sessions.set(session.guildId, newSession);

    this.startWatchdog(session.guildId);
    this.resetTimeout(session.guildId);
  }

  static getSession(guildId: string) {
    return this.sessions.get(guildId);
  }

  static hasSession(guildId: string) {
    return this.sessions.has(guildId);
  }

  // =====================================
  // 🔥 ADD ENTRIES (MERGED + CLEAN)
  // =====================================
  static addEntries(guildId: string, newEntries: SessionEntry[]) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    console.log("📥 SESSION ADD:", newEntries.length);

    const merged = this.mergeEntries([
      ...session.entries,
      ...newEntries,
    ]);

    session.entries = merged;

    console.log("🧠 AFTER MERGE:", merged.length);

    this.touch(guildId);
  }

  static getEntries(guildId: string): SessionEntry[] {
    return [...(this.sessions.get(guildId)?.entries || [])];
  }

  static clearEntries(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;
    session.entries = [];
  }

  // =====================================
  // UPDATE
  // =====================================
  static updateEntry(
    guildId: string,
    index: number,
    field: "nick" | "value",
    newValue: string
  ): boolean {
    const session = this.sessions.get(guildId);
    if (!session || !session.entries[index]) return false;

    const entry = session.entries[index];

    if (field === "nick") {
      entry.nickname = newValue.trim();
      session.entries = this.mergeEntries(session.entries);
      return true;
    }

    if (field === "value") {
      const parsed = parseValue(newValue);
      if (parsed === null) return false;

      entry.value = parsed;
      entry.raw = newValue;
      return true;
    }

    return false;
  }

  static removeEntry(guildId: string, index: number): boolean {
    const session = this.sessions.get(guildId);
    if (!session || !session.entries[index]) return false;

    session.entries.splice(index, 1);
    return true;
  }

  // =====================================
  // WATCHDOG
  // =====================================
  static touch(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.lastActivity = Date.now();
    this.resetTimeout(guildId);
  }

  private static startWatchdog(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    session.watchdogInterval = setInterval(() => {
      const diff = Date.now() - session.lastActivity;

      if (this.DEBUG) {
        console.log(`🐶 ${guildId} inactive: ${Math.floor(diff / 1000)}s`);
      }

      if (diff > 10 * 60 * 1000) {
        this.sendMessage(session.channelId, "💀 Session force-closed.");
        this.cleanupSession(session);
        this.deleteChannel(session.channelId);
        this.sessions.delete(guildId);
      }
    }, 30000);
  }

  private static cleanupSession(session: QuickAddSession) {
    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);
    if (session.buffer.timer) clearTimeout(session.buffer.timer);
    if (session.watchdogInterval) clearInterval(session.watchdogInterval);

    session.buffer.ocrResults = [];
  }

  static resetTimeout(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    const LIMIT = 3 * 60 * 1000;

    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);

    session.warningTimeout = setTimeout(() => {
      this.sendMessage(session.channelId, "⚠️ Closing in 60 seconds.");
    }, 2 * 60 * 1000);

    session.timeout = setTimeout(() => {
      const diff = Date.now() - session.lastActivity;

      if (diff < LIMIT) {
        this.resetTimeout(guildId);
        return;
      }

      this.sendMessage(session.channelId, "❌ Session closed.");
      this.cleanupSession(session);
      this.deleteChannel(session.channelId);
      this.sessions.delete(guildId);
    }, LIMIT);
  }

  static endSession(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    this.cleanupSession(session);
    this.sessions.delete(guildId);
  }
}