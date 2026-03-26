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
 * - MUST include session-level traceId
 */

import { createLogger } from "../debug/DebugLogger";
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

  traceId: string; // 🔥 NEW
};

// =====================================
// 🔹 STORAGE (IN-MEMORY)
// =====================================

const sessions = new Map<string, SessionData>();

// =====================================
// 🔹 HELPERS
// =====================================

function generateTraceId(): string {
  return `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// =====================================
// 🔹 SESSION MANAGER
// =====================================

export const QuickAddSession = {
  // =============================
  // 🚀 START SESSION
  // =============================
  start(data: {
    guildId: string;
    threadId: string;
    ownerId: string;
    type: QuickAddType;
  }) {
    const traceId = generateTraceId();

    log.trace("session_start_requested", traceId, {
      guildId: data.guildId,
      ownerId: data.ownerId,
      threadId: data.threadId,
      type: data.type,
    });

    const session: SessionData = {
      ...data,
      stage: "COLLECTING",
      createdAt: Date.now(),
      traceId,
    };

    sessions.set(data.guildId, session);

    log.trace("session_started", traceId, {
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

    log.trace("session_get", session?.traceId, {
      guildId,
      exists: !!session,
      stage: session?.stage,
    });

    return session;
  },

  // =============================
  // 🛑 END SESSION
  // =============================
  end(guildId: string) {
    const session = sessions.get(guildId);

    log.trace("session_end_requested", session?.traceId, {
      guildId,
      existed: !!session,
    });

    sessions.delete(guildId);

    log.trace("session_ended", session?.traceId, {
      guildId,
    });
  },

  // =============================
  // 🔁 UPDATE STAGE
  // =============================
  setStage(guildId: string, stage: QuickAddStage) {
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

    log.trace("session_stage_updated", session.traceId, {
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

    if (!session) {
      log.trace("session_owner_check_no_session", undefined, {
        guildId,
        userId,
      });
      return false;
    }

    const result = session.ownerId === userId;

    log.trace("session_owner_check", session.traceId, {
      guildId,
      userId,
      ownerId: session.ownerId,
      result,
    });

    return result;
  },

  // =============================
  // 🔒 CHECK THREAD CONTEXT
  // =============================
  isInSession(guildId: string, channelId: string): boolean {
    const session = sessions.get(guildId);

    if (!session) {
      log.trace("session_thread_check_no_session", undefined, {
        guildId,
        channelId,
      });
      return false;
    }

    const result = session.threadId === channelId;

    log.trace("session_thread_check", session.traceId, {
      guildId,
      channelId,
      threadId: session.threadId,
      result,
    });

    return result;
  },
};