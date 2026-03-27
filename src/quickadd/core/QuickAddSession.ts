// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { log } from "../logger";
import { createSessionId } from "./IdGenerator";
import { QuickAddType, QuickAddStage } from "./QuickAddTypes";

/**
 * 🧠 ROLE:
 * Manages QuickAdd session lifecycle.
 *
 * ❗ FINAL RULES:
 * - multi-session per guild
 * - ONE session per user (per guild)
 * - sessionId = source of truth
 * - NO business logic
 */

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
      log.emit({
        event: "session_start_blocked",
        traceId,
        level: "warn",
        data: {
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

    log.emit({
      event: "session_started",
      traceId,
      data: {
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
      log.emit({
        event: "session_setThread_missing",
        traceId,
        level: "warn",
        data: { guildId, userId },
      });
      return;
    }

    const updated: SessionData = {
      ...session,
      threadId,
    };

    sessions.set(key, updated);

    log.emit({
      event: "session_thread_attached",
      traceId,
      data: {
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
      log.emit({
        event: "session_setStage_missing",
        traceId,
        level: "warn",
        data: { guildId, userId },
      });
      return;
    }

    const allowed = ALLOWED_TRANSITIONS[session.stage] || [];

    if (!allowed.includes(nextStage)) {
      log.emit({
        event: "session_invalid_transition",
        traceId,
        level: "warn",
        data: {
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

    log.emit({
      event: "session_stage_updated",
      traceId,
      data: {
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

    log.emit({
      event: "session_ended",
      traceId,
      data: {
        sessionId: session?.sessionId,
        userId,
      },
    });
  },
};