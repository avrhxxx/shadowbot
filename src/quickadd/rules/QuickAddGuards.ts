// =====================================
// 📁 src/quickadd/rules/QuickAddGuards.ts
// =====================================

/**
 * 🧠 ROLE:
 * Guards and validators for QuickAdd commands.
 *
 * Responsible for:
 * - validating session existence
 * - validating correct thread context
 * - validating session ownership
 *
 * ❗ RULES:
 * - NO side effects
 * - NO business logic
 * - pure validation helpers
 */

import { Channel, ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";
import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🧱 TYPES
// =====================================

type SessionData = ReturnType<typeof QuickAddSession.get> extends infer T
  ? T extends null
    ? never
    : T
  : never;

// =====================================
// 🧠 CORE GUARDS
// =====================================

export function isSessionActive(
  session: SessionData | null,
  traceId: string
): boolean {
  const result = !!session;

  log.trace("guard_session_active", traceId, {
    result,
  });

  return result;
}

export function isSessionOwner(
  userId: string,
  session: SessionData | null,
  traceId: string
): boolean {
  const result = session?.ownerId === userId;

  log.trace("guard_session_owner", traceId, {
    userId,
    ownerId: session?.ownerId,
    result,
  });

  return result;
}

export function isInQuickAddThread(
  channel: Channel | null,
  session: SessionData | null,
  traceId: string
): boolean {
  if (!channel || !session) {
    log.trace("guard_thread_missing_context", traceId, {
      hasChannel: !!channel,
      hasSession: !!session,
    });
    return false;
  }

  // 🔥 main thread
  if (channel.id === session.threadId) {
    log.trace("guard_thread_match_main", traceId, {
      channelId: channel.id,
      threadId: session.threadId,
    });
    return true;
  }

  // 🔥 child thread
  if ("parentId" in channel && channel.parentId === session.threadId) {
    log.trace("guard_thread_match_child", traceId, {
      channelId: channel.id,
      parentId: (channel as any).parentId,
      threadId: session.threadId,
    });
    return true;
  }

  log.trace("guard_thread_mismatch", traceId, {
    channelId: channel.id,
    threadId: session.threadId,
  });

  return false;
}

// =====================================
// 🧠 VALIDATORS (USER-FACING)
// =====================================

export function validateQuickAddContext(
  interaction: ChatInputCommandInteraction,
  session: SessionData | null,
  traceId: string
): string | null {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const channelId = interaction.channel?.id;

  if (!isSessionActive(session, traceId)) {
    log.warn("guard_fail_no_session", {
      traceId,
      guildId,
      userId,
      channelId,
    });

    return "❌ No active session";
  }

  if (!isInQuickAddThread(interaction.channel, session, traceId)) {
    log.warn("guard_fail_wrong_thread", {
      traceId,
      guildId,
      userId,
      channelId,
      expectedThread: session.threadId,
    });

    return "❌ Use this command inside QuickAdd thread";
  }

  log.trace("guard_context_ok", traceId, {
    guildId,
    userId,
    channelId,
  });

  return null;
}

export function validateSessionOwner(
  interaction: ChatInputCommandInteraction,
  session: SessionData | null,
  traceId: string
): string | null {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!isSessionActive(session, traceId)) {
    log.warn("guard_owner_no_session", {
      traceId,
      guildId,
      userId,
    });

    return "❌ No active session";
  }

  if (!isSessionOwner(interaction.user.id, session, traceId)) {
    log.warn("guard_owner_mismatch", {
      traceId,
      guildId,
      userId,
      ownerId: session.ownerId,
    });

    return "❌ Only session owner can use this command";
  }

  log.trace("guard_owner_ok", traceId, {
    guildId,
    userId,
  });

  return null;
}