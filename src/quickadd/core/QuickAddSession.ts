// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

/**
 * 🧠 ROLE:
 * In-memory session manager for QuickAdd.
 *
 * Responsible for:
 * - session lifecycle (start / end)
 * - access control (owner, thread)
 * - storing session context (type, stage)
 *
 * ❗ RULES:
 * - NO business logic
 * - pure state manager
 * - one session per guild
 * - sessionId GENERATED HERE
 * - traceId ONLY for logging (injected)
 */

import { createLogger } from "../debug/DebugLogger";
import { createSessionId } from "./IdGenerator";

const log = createLogger("SESSION");

// =====================================
// 🔹 TYPES
// =====================================

import { QuickAddType, QuickAddStage } from "./QuickAddTypes";

type SessionData = {
  guildId: string;
  threadId: string;
  ownerId: string;

  type: QuickAddType;
  stage: QuickAddStage;

  createdAt: number;

  sessionId: string; // ✅ FIX
};

// =====================================
// 🔹 STORAGE (IN-MEMORY)
// =====================================

const sessions = new Map<string, SessionData>();

// =====================================
// 🔹 SESSION MANAGER
// =====================================

export const QuickAddSession = {
  // =============================
  // 🚀 START SESSION
  // =============================
  start(
    data: {
      guildId: string;
      threadId: string;
      ownerId: string;
      type: QuickAddType;
    },
    traceId: string // ✅ INJECTED
  ) {
    const sessionId = createSessionId();

    log.trace("session_start_requested", traceId, {
      sessionId,
      guildId: data.guildId,
      ownerId: data.ownerId,
      threadId: data.threadId,
      type: data.type,
    });

    const session: SessionData = {
      ...data,
      sessionId,
      stage: "COLLECTING",
      createdAt: Date.now(),
    };

    sessions.set(data.guildId, session);

    log.trace("session_started", traceId, {
      sessionId,
      guildId: data.guildId,
      stage: session.stage,
      createdAt: session.createdAt,
    });

    return session;
  },

  // =============================
  // 📥 GET SESSION
  // =============================
  get(guildId: string): SessionData | null {
    const session = sessions.get(guildId) || null;

    return session;
  },

  // =============================
  // 🛑 END SESSION
  // =============================
  end(guildId: string, traceId: string) {
    const session = sessions.get(guildId);

    log.trace("session_end_requested", traceId, {
      sessionId: session?.sessionId,
      guildId,
      existed: !!session,
    });

    sessions.delete(guildId);

    log.trace("session_ended", traceId, {
      sessionId: session?.sessionId,
      guildId,
    });
  },

  // =============================
  // 🔁 UPDATE STAGE
  // =============================
  setStage(
    guildId: string,
    stage: QuickAddStage,
    traceId: string
  ) {
    const session = sessions.get(guildId);

    if (!session) {
      log.warn("session_setStage_missing", {
        guildId,
        nextStage: stage,
      });
      return;
    }

    const prevStage = session.stage;

    session.stage = stage;

    log.trace("session_stage_updated", traceId, {
      sessionId: session.sessionId,
      guildId,
      from: prevStage,
      to: stage,
    });
  },

  // =============================
  // 🔒 CHECK OWNER
  // =============================
  isOwner(guildId: string, userId: string): boolean {
    const session = sessions.get(guildId);
    return session ? session.ownerId === userId : false;
  },

  // =============================
  // 🔒 CHECK THREAD CONTEXT
  // =============================
  isInSession(guildId: string, channelId: string): boolean {
    const session = sessions.get(guildId);
    return session ? session.threadId === channelId : false;
  },
};