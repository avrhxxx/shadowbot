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

  // 🔥 NEW
  statusMessageId?: string;
  imageCount?: number;

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

  private static log(...args: any[]) {
    if (this.DEBUG) {
      console.log("[SESSION]", ...args);
    }
  }

  // =====================================
  // 🧠 NORMALIZE KEY
  // =====================================
  private static normalizeKey(nick: string): string {
    return nick
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  // =====================================
  // 🧠 VALIDATE ENTRY
  // =====================================
  private static isValidEntry(e: SessionEntry): boolean {
    if (!e) return false;

    const nick = e.nickname?.trim();

    if (!nick || nick.length < 2) return false;
    if (!/[a-z]/i.test(nick)) return false;
    if (typeof e.value !== "number" || isNaN(e.value)) return false;
    if (e.value < 0) return false;

    return true;
  }

  // =====================================
  // 🧠 MERGE ENGINE
  // =====================================
  private static mergeEntries(entries: SessionEntry[]): SessionEntry[] {
    const map = new Map<string, SessionEntry>();

    for (const e of entries) {
      if (!this.isValidEntry(e)) {
        this.log("⛔ INVALID ENTRY SKIPPED:", e);
        continue;
      }

      const key = this.normalizeKey(e.nickname);
      if (!key) continue;

      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...e });
        continue;
      }

      if (e.value > existing.value) {
        this.log("🔁 REPLACE (higher value):", existing, "→", e);
        map.set(key, { ...e });
        continue;
      }

      if (
        e.value === existing.value &&
        e.nickname.length > existing.nickname.length
      ) {
        this.log("🔁 REPLACE (better nick):", existing, "→", e);
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

      // 🔥 INIT
      statusMessageId: undefined,
      imageCount: 0,
    };

    this.sessions.set(session.guildId, newSession);

    this.log("🆕 SESSION CREATED:", session.guildId);

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
  // 🔥 ADD ENTRIES
  // =====================================
  static addEntries(guildId: string, newEntries: SessionEntry[]) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    this.log("📥 ADD ENTRIES:", newEntries.length);

    const filtered = newEntries.filter((e) => this.isValidEntry(e));

    this.log("🧹 FILTERED:", filtered.length);

    const merged = this.mergeEntries([
      ...session.entries,
      ...filtered,
    ]);

    session.entries = merged;

    this.log("🧠 AFTER MERGE:", merged.length);

    merged.slice(0, 10).forEach((e, i) => {
      this.log(`[${i}] ${e.nickname} → ${e.value}`);
    });

    this.touch(guildId);
  }

  static getEntries(guildId: string): SessionEntry[] {
    return [...(this.sessions.get(guildId)?.entries || [])];
  }

  static clearEntries(guildId: string) {
    const session = this.sessions.get(guildId);
    if (!session) return;

    this.log("🧹 CLEAR ENTRIES:", guildId);

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
      const newNick = newValue.trim();

      if (newNick.length < 2) return false;

      this.log("✏️ UPDATE NICK:", entry.nickname, "→", newNick);

      entry.nickname = newNick;
      session.entries = this.mergeEntries(session.entries);
      return true;
    }

    if (field === "value") {
      const parsed = parseValue(newValue);
      if (parsed === null) return false;

      this.log("✏️ UPDATE VALUE:", entry.value, "→", parsed);

      entry.value = parsed;
      entry.raw = newValue;
      return true;
    }

    return false;
  }

  static removeEntry(guildId: string, index: number): boolean {
    const session = this.sessions.get(guildId);
    if (!session || !session.entries[index]) return false;

    this.log("🗑 REMOVE ENTRY:", session.entries[index]);

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
    this.log("🧹 CLEANUP SESSION:", session.guildId);

    if (session.timeout) clearTimeout(session.timeout);
    if (session.warningTimeout) clearTimeout(session.warningTimeout);
    if (session.buffer.timer) clearTimeout(session.buffer.timer);
    if (session.watchdogInterval) clearInterval(session.watchdogInterval);

    session.buffer.ocrResults = [];

    // 🔥 RESET NOWYCH POL
    session.statusMessageId = undefined;
    session.imageCount = 0;
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

    this.log("🛑 END SESSION:", guildId);

    this.cleanupSession(session);
    this.sessions.delete(guildId);
  }
}