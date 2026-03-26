// =====================================
// 📁 src/quickadd/storage/QuickAddSessionRepository.ts
// =====================================

/**
 * 💾 ROLE:
 * Persistence layer for QuickAdd sessions (Google Sheets).
 *
 * Responsible for:
 * - storing session lifecycle (start / end)
 * - updating session status
 * - providing simple session lookup
 *
 * ❗ RULES:
 * - NO business logic
 * - NO validation
 * - only data IO
 * - uses SheetRepository (object-based)
 *
 * Acts as:
 * QuickAddSession → SessionRepository → SheetRepository → Google Sheets
 */

import { SheetRepository } from "../../google/SheetRepository";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("SESSION_REPO");

// =====================================
// 📌 CONFIG
// =====================================

const TAB = "quickadd_sessions";

// =====================================
// 🧱 TYPES
// =====================================

export type QuickAddSessionRow = {
  sessionId: string;
  displayId: string;

  guildId: string;
  ownerId: string;
  threadId: string;

  type: string;

  status: "ACTIVE" | "ENDED" | "ERROR";

  createdAt: number;
  endedAt?: number;
};

// =====================================
// 🧠 REPOSITORY INSTANCE
// =====================================

const repo = new SheetRepository<QuickAddSessionRow>(TAB);

// =====================================
// 🚀 PUBLIC API
// =====================================

export const QuickAddSessionRepository = {
  // =============================
  // 🚀 CREATE (SESSION START)
  // =============================
  async createSession(data: {
    sessionId: string;
    displayId: string;

    guildId: string;
    ownerId: string;
    threadId: string;

    type: string;

    traceId: string;
  }) {
    const row: QuickAddSessionRow = {
      sessionId: data.sessionId,
      displayId: data.displayId,

      guildId: data.guildId,
      ownerId: data.ownerId,
      threadId: data.threadId,

      type: data.type,

      status: "ACTIVE",

      createdAt: Date.now(),
    };

    await repo.create(row);

    log.trace("session_created", data.traceId, {
      sessionId: data.sessionId,
      guildId: data.guildId,
      type: data.type,
    });
  },

  // =============================
  // 🛑 END SESSION
  // =============================
  async endSession(params: {
    sessionId: string;
    traceId: string;
  }) {
    const existing = await repo.findAll({ sessionId: params.sessionId });

    if (!existing.length) {
      log.warn("session_not_found_on_end", {
        sessionId: params.sessionId,
      });
      return;
    }

    const session = existing[0];

    await repo.updateById(session.sessionId, {
      status: "ENDED",
      endedAt: Date.now(),
    });

    log.trace("session_ended", params.traceId, {
      sessionId: params.sessionId,
    });
  },

  // =============================
  // 💥 MARK ERROR
  // =============================
  async markError(params: {
    sessionId: string;
    traceId: string;
  }) {
    const existing = await repo.findAll({ sessionId: params.sessionId });

    if (!existing.length) {
      log.warn("session_not_found_on_error", {
        sessionId: params.sessionId,
      });
      return;
    }

    const session = existing[0];

    await repo.updateById(session.sessionId, {
      status: "ERROR",
      endedAt: Date.now(),
    });

    log.trace("session_marked_error", params.traceId, {
      sessionId: params.sessionId,
    });
  },

  // =============================
  // 📥 GET SESSION
  // =============================
  async getSession(sessionId: string): Promise<QuickAddSessionRow | null> {
    const result = await repo.findAll({ sessionId });

    return result[0] || null;
  },

  // =============================
  // 📊 GET ACTIVE SESSIONS
  // =============================
  async getActiveSessions(): Promise<QuickAddSessionRow[]> {
    return repo.findAll({ status: "ACTIVE" });
  },
};