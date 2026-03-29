// =====================================
// 📁 src/system/quickadd/core/QuickAddSession.ts
// =====================================

import { log } from "../../../core/logger/log";
import { createSessionId } from "../../../core/ids/IdGenerator";
import { QuickAddType, QuickAddStage } from "./QuickAddTypes";
import { TraceContext } from "../../../core/trace/TraceContext";

// =====================================
// 🧱 TYPES
// =====================================

type SessionData = {
  guildId: string;
  threadId: string | null;

  userId: string;
  ownerId: string;

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
    ctx: TraceContext
  ) {
    const l = log.ctx(ctx);

    const key = buildKey(data.guildId, data.userId);
    const existing = sessions.get(key);

    if (existing) {
      l.warn("session_start_blocked", {
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

    l.event("session_started", {
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
    ctx: TraceContext
  ) {
    const l = log.ctx(ctx);

    const key = buildKey(guildId, userId);
    const session = sessions.get(key);

    if (!session) {
      l.warn("session_set_thread_missing", {
        context: { guildId, userId },
      });
      return;
    }

    const updated: SessionData = {
      ...session,
      threadId,
    };

    sessions.set(key, updated);

    l.event("session_thread_attached", {
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
    ctx: TraceContext
  ) {
    const l = log.ctx(ctx);

    const key = buildKey(guildId, userId);
    const session = sessions.get(key);

    if (!session) {
      l.warn("session_set_stage_missing", {
        context: { guildId, userId },
      });
      return;
    }

    const allowed = ALLOWED_TRANSITIONS[session.stage] || [];

    if (!allowed.includes(nextStage)) {
      l.warn("session_invalid_transition", {
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

    l.event("session_stage_updated", {
      context: {
        sessionId: session.sessionId,
        from: session.stage,
        to: nextStage,
      },
    });
  },

  end(guildId: string, userId: string, ctx: TraceContext) {
    const l = log.ctx(ctx);

    const key = buildKey(guildId, userId);
    const session = sessions.get(key);

    sessions.delete(key);

    l.event("session_ended", {
      context: {
        sessionId: session?.sessionId,
        userId,
      },
    });
  },
};