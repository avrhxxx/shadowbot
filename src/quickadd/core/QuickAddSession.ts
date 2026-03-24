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
 * - NO business logic (no OCR, parsing, etc.)
 * - pure state manager
 * - one session per guild
 */

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
  start(data: {
    guildId: string;
    threadId: string;
    ownerId: string;
    type: QuickAddType;
  }) {
    const session: SessionData = {
      ...data,
      stage: "COLLECTING",
      createdAt: Date.now(),
    };

    sessions.set(data.guildId, session);

    return session;
  },

  // =============================
  // 📥 GET SESSION
  // =============================
  get(guildId: string): SessionData | null {
    return sessions.get(guildId) || null;
  },

  // =============================
  // 🛑 END SESSION
  // =============================
  end(guildId: string) {
    sessions.delete(guildId);
  },

  // =============================
  // 🔁 UPDATE STAGE
  // =============================
  setStage(guildId: string, stage: QuickAddStage) {
    const session = sessions.get(guildId);
    if (!session) return;

    session.stage = stage;
  },

  // =============================
  // 🔒 CHECK OWNER
  // =============================
  isOwner(guildId: string, userId: string): boolean {
    const session = sessions.get(guildId);
    if (!session) return false;

    return session.ownerId === userId;
  },

  // =============================
  // 🔒 CHECK THREAD CONTEXT
  // =============================
  isInSession(guildId: string, channelId: string): boolean {
    const session = sessions.get(guildId);
    if (!session) return false;

    return session.threadId === channelId;
  },
};