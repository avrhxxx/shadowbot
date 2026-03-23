// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";
import { QuickAddType } from "./QuickAddTypes";

const log = createLogger("SESSION");

// 🔥 NEW — SESSION STAGE
type QuickAddStage =
  | "COLLECTING"
  | "CONFIRM_PENDING";

type SessionData = {
  guildId: string;
  threadId: string;
  ownerId: string;
  type: QuickAddType;

  // 🔥 NEW
  stage: QuickAddStage;
  finalPreview?: string;
  confirmStartedAt?: number;
};

const sessions = new Map<string, SessionData>();

export const QuickAddSession = {
  start(
    guildId: string,
    threadId: string,
    ownerId: string,
    type: QuickAddType
  ) {
    if (sessions.has(guildId)) {
      throw new Error("Session already exists");
    }

    const session: SessionData = {
      guildId,
      threadId,
      ownerId,
      type,

      // 🔥 INIT STAGE
      stage: "COLLECTING",
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
    const session = sessions.get(guildId) || null;

    log("session_get", {
      guildId,
      found: !!session,
    });

    return session;
  },

  isInSession(guildId: string, channelId: string): boolean {
    const session = sessions.get(guildId);

    const valid = session?.threadId === channelId;

    log("session_check_channel", {
      guildId,
      channelId,
      valid,
    });

    return !!valid;
  },

  isOwner(guildId: string, userId: string): boolean {
    const session = sessions.get(guildId);

    const isOwner = session?.ownerId === userId;

    log("session_check_owner", {
      guildId,
      userId,
      isOwner,
    });

    return !!isOwner;
  },
};