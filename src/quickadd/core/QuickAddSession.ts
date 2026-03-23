// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { debug } from "../debug/DebugLogger";

const SCOPE = "SESSION";

type SessionData = {
  guildId: string;
  channelId: string;
  ownerId: string;
};

const sessions = new Map<string, SessionData>();

export const QuickAddSession = {
  start(guildId: string, channelId: string, ownerId: string) {
    if (sessions.has(guildId)) {
      debug(SCOPE, "SESSION_ALREADY_EXISTS", guildId);
      return null;
    }

    const session: SessionData = {
      guildId,
      channelId,
      ownerId,
    };

    sessions.set(guildId, session);

    debug(SCOPE, "SESSION_STARTED", session);

    return session;
  },

  end(guildId: string) {
    const existed = sessions.delete(guildId);

    debug(SCOPE, "SESSION_ENDED", {
      guildId,
      existed,
    });
  },

  get(guildId: string): SessionData | null {
    return sessions.get(guildId) || null;
  },
};