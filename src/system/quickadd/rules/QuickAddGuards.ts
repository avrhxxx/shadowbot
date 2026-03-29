// =====================================
// 📁 src/quickadd/rules/QuickAddGuards.ts
// =====================================

import {
  Channel,
  ChatInputCommandInteraction,
} from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";
import { logger } from "../core/logger/log";

// =====================================
// 🧠 CORE GUARDS (PURE)
// =====================================

export function isSessionActive(
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): boolean {
  const result = !!session;

  logger.emit({
    event: "guard_session_active",
    traceId,
    result: { isActive: result },
  });

  return result;
}

export function isSessionOwner(
  userId: string,
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): boolean {
  const result = session?.ownerId === userId;

  logger.emit({
    event: "guard_session_owner",
    traceId,
    context: {
      userId,
      ownerId: session?.ownerId,
    },
    result: { isOwner: result },
  });

  return result;
}

export function isInQuickAddThread(
  channel: Channel | null,
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): boolean {
  if (!channel || !session) {
    logger.emit({
      event: "guard_thread_missing_context",
      traceId,
      context: {
        hasChannel: !!channel,
        hasSession: !!session,
      },
      result: { match: false },
    });

    return false;
  }

  if (channel.id === session.threadId) {
    logger.emit({
      event: "guard_thread_match_main",
      traceId,
      context: {
        channelId: channel.id,
        threadId: session.threadId,
      },
      result: { match: true },
    });

    return true;
  }

  if ("parentId" in channel && channel.parentId === session.threadId) {
    logger.emit({
      event: "guard_thread_match_child",
      traceId,
      context: {
        channelId: channel.id,
        parentId: channel.parentId,
        threadId: session.threadId,
      },
      result: { match: true },
    });

    return true;
  }

  logger.emit({
    event: "guard_thread_mismatch",
    traceId,
    context: {
      channelId: channel.id,
      threadId: session.threadId,
    },
    result: { match: false },
  });

  return false;
}

// =====================================
// 🧠 VALIDATORS (USER-FACING)
// =====================================

export function validateQuickAddContext(
  interaction: ChatInputCommandInteraction,
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): string | null {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const channelId = interaction.channel?.id;

  if (!session) {
    logger.emit({
      event: "guard_fail_no_session",
      traceId,
      level: "warn",
      context: { guildId, userId, channelId },
    });

    return "❌ No active session";
  }

  // 🔥 multi-session isolation
  if (session.userId !== userId) {
    logger.emit({
      event: "guard_fail_wrong_user",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
        sessionUserId: session.userId,
      },
    });

    return "❌ This is not your session";
  }

  if (!isInQuickAddThread(interaction.channel, session, traceId)) {
    logger.emit({
      event: "guard_fail_wrong_thread",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
        channelId,
        expectedThread: session.threadId,
      },
    });

    return "❌ Use this command inside QuickAdd thread";
  }

  logger.emit({
    event: "guard_context_ok",
    traceId,
    context: { guildId, userId, channelId },
  });

  return null;
}

export function validateSessionOwner(
  interaction: ChatInputCommandInteraction,
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): string | null {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!session) {
    logger.emit({
      event: "guard_owner_no_session",
      traceId,
      level: "warn",
      context: { guildId, userId },
    });

    return "❌ No active session";
  }

  if (session.ownerId !== userId) {
    logger.emit({
      event: "guard_owner_mismatch",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
        ownerId: session.ownerId,
      },
    });

    return "❌ Only session owner can use this command";
  }

  logger.emit({
    event: "guard_owner_ok",
    traceId,
    context: { guildId, userId },
  });

  return null;
}