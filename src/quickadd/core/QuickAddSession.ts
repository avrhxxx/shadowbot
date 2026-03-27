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
 * - one session per guild
 * - no business logic
 * - no ID generation except sessionId
 */

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

const ALLOWED_TRANSITIONS: Record<QuickAddStage, QuickAddStage[]> = {
  COLLECTING: ["CONFIRM_PENDING"],
  CONFIRM_PENDING: [],
};

export const QuickAddSession = {
  start(data: Omit<SessionData, "sessionId" | "stage" | "createdAt">, traceId: string) {
    const existing = sessions.get(data.guildId);

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
      sessionId: createSessionId(),
      stage: "COLLECTING",
      createdAt: Date.now(),
    };

    sessions.set(data.guildId, session);

    log.emit({
      event: "session_started",
      traceId,
      data: { sessionId: session.sessionId },
    });

    return session;
  },

  get: (guildId: string) => sessions.get(guildId) || null,

  end(guildId: string, traceId: string) {
    const session = sessions.get(guildId);

    sessions.delete(guildId);

    log.emit({
      event: "session_ended",
      traceId,
      data: { sessionId: session?.sessionId },
    });
  },
};