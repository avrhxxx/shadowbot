// =====================================
// 📁 src/system/quickadd/core/QuickAddSession.ts
// =====================================

/**
 * 🧠 ROLE:
 * Manages QuickAdd session lifecycle.
 *
 * Responsible for:
 * - creating session (ONE per user per guild)
 * - storing session state
 * - handling stage transitions
 * - attaching thread
 * - ending session
 *
 * ❗ FINAL RULES:
 * - multi-session per guild
 * - ONE session per user (per guild)
 * - sessionId = source of truth
 * - NO business logic
 * - logger.emit ONLY
 */

import { logger } from "../../../core/logger/log";
import { createSessionId } from "../../../core/ids/IdGenerator";
import { QuickAddType, QuickAddStage } from "./QuickAddTypes";

// =====================================
// 🧱 TYPES
// =====================================

type SessionData = {
  guildId: string;
  threadId: string | null;

  userId: string;   // 🔥 PRIMARY KEY (logic)
  ownerId: string;  // 🔥 semantic (for future extensions)

  type: QuickAddType;
  stage: QuickAddStage;

  createdAt: number;
  sessionId: string;
};

// 🔥 KEY = guildId:userId
const sessions = new Map<string, SessionData>();

const ALLOWED_TRANSITIONS: Record<QuickAddStage, QuickAddStage[]> = {
  COLLECTING: ["CONFIRM_PENDING"],
  CONFIRM_PENDING: [],
};

// =====================================
// 🔹 HELPERS
// =====================================

function buildKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

// =====================================
// 🚀 API
// =====================================

export const QuickAddSession = {
  start(
    data: Omit<SessionData, "sessionId" | "stage" | "createdAt">,
    traceId: string
  ) {
    const key = buildKey(data.guildId, data.userId);

    const existing = sessions.get(key);

    if (existing) {
      logger.emit({
        scope: "quickadd.session",
        event: "session_start_blocked",
        traceId,
        level: "warn",
        context: {
          sessionId: existing.sessionId,
          userId: existing.userId,
        },
      });
      return null;
    }

    const session: SessionData = {
      ...data,
      threadId: data.threadId ?? null,
      sessionId: createSessionId(),
      stage: "COLLECTING",
      createdAt: Date.now(),
    };

    sessions.set(key, session);

    logger.emit({
      scope: "quickadd.session",
      event: "session_started",
      traceId,
      context: {
        sessionId: session.sessionId,
        userId: session.userId,
      },
    });

    return session;
  },

  get(guildId: string, userId: string) {
    return sessions.get(buildKey(guildId, userId)) || null;
  },

  setThreadId(
    guildId: string,
    userId: string,
    threadId: string,
    traceId: string
  ) {
    const key = buildKey(guildId, userId);
    const session = sessions.get(key);

    if (!session) {
      logger.emit({
        scope: "quickadd.session",
        event: "session_set_thread_missing",
        traceId,
        level: "warn",
        context: { guildId, userId },
      });
      return;
    }

    const updated: SessionData = {
      ...session,
      threadId,
    };

    sessions.set(key, updated);

    logger.emit({
      scope: "quickadd.session",
      event: "session_thread_attached",
      traceId,
      context: {
        sessionId: session.sessionId,
        threadId,
      },
    });
  },

  setStage(
    guildId: string,
    userId: string,
    nextStage: QuickAddStage,
    traceId: string
  ) {
    const key = buildKey(guildId, userId);
    const session = sessions.get(key);

    if (!session) {
      logger.emit({
        scope: "quickadd.session",
        event: "session_set_stage_missing",
        traceId,
        level: "warn",
        context: { guildId, userId },
      });
      return;
    }

    const allowed = ALLOWED_TRANSITIONS[session.stage] || [];

    if (!allowed.includes(nextStage)) {
      logger.emit({
        scope: "quickadd.session",
        event: "session_invalid_transition",
        traceId,
        level: "warn",
        context: {
          sessionId: session.sessionId,
          from: session.stage,
          to: nextStage,
        },
      });
      return;
    }

    const updated: SessionData = {
      ...session,
      stage: nextStage,
    };

    sessions.set(key, updated);

    logger.emit({
      scope: "quickadd.session",
      event: "session_stage_updated",
      traceId,
      context: {
        sessionId: session.sessionId,
        from: session.stage,
        to: nextStage,
      },
    });
  },

  end(guildId: string, userId: string, traceId: string) {
    const key = buildKey(guildId, userId);
    const session = sessions.get(key);

    sessions.delete(key);

    logger.emit({
      scope: "quickadd.session",
      event: "session_ended",
      traceId,
      context: {
        sessionId: session?.sessionId,
        userId,
      },
    });
  },
};