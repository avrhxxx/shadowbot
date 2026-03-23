// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("SESSION");

type SessionData = {
  guildId: string;
  channelId: string;
  ownerId: string;
};

const sessions = new Map<string, SessionData>();

export const QuickAddSession = {
  start(guildId: string, channelId: string, ownerId: string) {
    if (sessions.has(guildId)) {
      log.warn("session_already_exists", guildId);
      return null;
    }

    const session: SessionData = {
      guildId,
      channelId,
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
};