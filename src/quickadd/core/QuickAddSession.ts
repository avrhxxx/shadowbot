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
 * ❗ RULES:
 * - one session per (guildId + userId)
 * - no business logic
 * - no ID generation except sessionId
 */

type SessionData = {
  guildId: string;
  userId: string;
  threadId: string | null;
  ownerId: string;

  type: QuickAddType;
  stage: QuickAddStage;

  createdAt: number;
  sessionId: string;
};

const sessions = new Map<string, SessionData>();

const ALLOWED_TRANSITIONS: Record<QuickAddStage, QuickAddStage[]> = {
  COLLECTING: ["CONFIRM_PENDING"],
  CONFIRM_PENDING: [],
};

// 🔑 KEY BUILDER
function buildKey(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}

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
        data: { existingSessionId: existing.sessionId },
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
        guildId: data.guildId,
        userId: data.userId,
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
        guildId,
        userId,
      },
    });
  },
};