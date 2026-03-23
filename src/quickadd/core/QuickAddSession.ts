// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("SESSION");

type SessionData = {
  guildId: string;
  threadId: string; // 🔥 was channelId → now thread-based
  ownerId: string;
};

const sessions = new Map<string, SessionData>();

export const QuickAddSession = {
  start(guildId: string, threadId: string, ownerId: string) {
    if (sessions.has(guildId)) {
      log.warn("session_already_exists", guildId);
      return null;
    }

    const session: SessionData = {
      guildId,
      threadId,
      ownerId,
    };

    sessions.set(guildId, session);

    log("session_started", session);

    return session;
  },

  end(guildId: string) {
    const existed = sessions.delete(guildId);

    log("session_ended", {
      guildId,
      existed,
    });
  },

  get(guildId: string): SessionData | null {
    return sessions.get(guildId) || null;
  },

  // =====================================
  // 🔍 HELPERS
  // =====================================

  isInSession(guildId: string, channelId: string): boolean {
    const session = sessions.get(guildId);
    if (!session) return false;

    return session.threadId === channelId;
  },

  isOwner(guildId: string, userId: string): boolean {
    const session = sessions.get(guildId);
    if (!session) return false;

    return session.ownerId === userId;
  },
};