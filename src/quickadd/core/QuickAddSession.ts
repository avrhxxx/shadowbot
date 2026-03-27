// =====================================
// 📁 src/quickadd/core/QuickAddSession.ts
// =====================================

import { createScopedLogger } from "../debug/logger";
import { createSessionId } from "./IdGenerator";
import { QuickAddType, QuickAddStage } from "./QuickAddTypes";

const log = createScopedLogger(__filename);

type SessionData = {
  guildId: string;
  threadId: string;
  ownerId: string;

  type: QuickAddType;
  stage: QuickAddStage;

  createdAt: number;

  sessionId: string;
};

const sessions = new Map<string, SessionData>();

// =====================================
// 🧠 ALLOWED TRANSITIONS
// =====================================

const ALLOWED_TRANSITIONS: Record<QuickAddStage, QuickAddStage[]> = {
  COLLECTING: ["CONFIRM_PENDING"],
  CONFIRM_PENDING: [],
};

export const QuickAddSession = {
  start(
    data: {
      guildId: string;
      threadId: string;
      ownerId: string;
      type: QuickAddType;
    },
    traceId: string
  ): SessionData | null {
    const existing = sessions.get(data.guildId);

    if (existing) {
      log.warn("session_start_blocked_existing", traceId, {
        guildId: data.guildId,
        existingSessionId: existing.sessionId,
      });

      return null;
    }

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

  get(guildId: string): SessionData | null {
    return sessions.get(guildId) || null;
  },

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

  setStage(
    guildId: string,
    nextStage: QuickAddStage,
    traceId: string
  ) {
    const session = sessions.get(guildId);

    if (!session) {
      log.warn("session_setStage_missing", traceId, {
        guildId,
        nextStage,
      });
      return;
    }

    const prevStage = session.stage;

    // =====================================
    // ❌ INVALID TRANSITION GUARD
    // =====================================

    const allowed = ALLOWED_TRANSITIONS[prevStage] || [];

    if (!allowed.includes(nextStage)) {
      log.warn("session_invalid_transition", traceId, {
        sessionId: session.sessionId,
        guildId,
        from: prevStage,
        to: nextStage,
      });
      return;
    }

    // =====================================
    // ❌ DUPLICATE TRANSITION GUARD
    // =====================================

    if (prevStage === nextStage) {
      log.warn("session_duplicate_transition", traceId, {
        sessionId: session.sessionId,
        guildId,
        stage: prevStage,
      });
      return;
    }

    session.stage = nextStage;

    log.trace("session_stage_updated", traceId, {
      sessionId: session.sessionId,
      guildId,
      from: prevStage,
      to: nextStage,
    });
  },
};