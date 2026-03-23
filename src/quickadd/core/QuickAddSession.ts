// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";
import { QuickAddType } from "./QuickAddTypes";

const log = createLogger("SESSION");

type SessionData = {
  guildId: string;
  threadId: string;
  ownerId: string;
  type: QuickAddType; // 🔥 NEW
};

const sessions = new Map<string, SessionData>();

export const QuickAddSession = {
  start(
    guildId: string,
    threadId: string,
    ownerId: string,
    type: QuickAddType // 🔥 NEW
  ) {
    if (sessions.has(guildId)) {
      throw new Error("Session already exists"); // 🔥 FIX
    }

    const session: SessionData = {
      guildId,
      threadId,
      ownerId,
      type, // 🔥 NEW
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