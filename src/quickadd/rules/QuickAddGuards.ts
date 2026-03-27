// =====================================
// 📁 src/quickadd/rules/QuickAddGuards.ts
// =====================================

import {
  Channel,
  ChatInputCommandInteraction,
} from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";
import { log } from "@/quickadd/debug/logger";

// =====================================
// 🧠 CORE GUARDS (PURE)
// =====================================

export function isSessionActive(
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): boolean {
  const result = !!session;

  log.emit({
    scope: "QuickAddGuards",
    event: "guard_session_active",
    traceId,
    data: { result },
  });

  return result;
}

export function isSessionOwner(
  userId: string,
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): boolean {
  const result = session?.ownerId === userId;

  log.emit({
    scope: "QuickAddGuards",
    event: "guard_session_owner",
    traceId,
    data: {
      userId,
      ownerId: session?.ownerId,
      result,
    },
  });

  return result;
}

export function isInQuickAddThread(
  channel: Channel | null,
  session: ReturnType<typeof QuickAddSession.get>,
  traceId: string
): boolean {
  if (!channel || !session) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_thread_missing_context",
      traceId,
      data: {
        hasChannel: !!channel,
        hasSession: !!session,
      },
    });

    return false;
  }

  // MAIN THREAD
  if (channel.id === session.threadId) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_thread_match_main",
      traceId,
      data: {
        channelId: channel.id,
        threadId: session.threadId,
      },
    });

    return true;
  }

  // CHILD THREAD (Discord ThreadChannel)
  if ("parentId" in channel && channel.parentId === session.threadId) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_thread_match_child",
      traceId,
      data: {
        channelId: channel.id,
        parentId: channel.parentId,
        threadId: session.threadId,
      },
    });

    return true;
  }

  log.emit({
    scope: "QuickAddGuards",
    event: "guard_thread_mismatch",
    traceId,
    data: {
      channelId: channel.id,
      threadId: session.threadId,
    },
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

  if (!isSessionActive(session, traceId)) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_fail_no_session",
      traceId,
      data: {
        guildId,
        userId,
        channelId,
      },
      level: "warn",
    });

    return "❌ No active session";
  }

  if (!isInQuickAddThread(interaction.channel, session, traceId)) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_fail_wrong_thread",
      traceId,
      data: {
        guildId,
        userId,
        channelId,
        expectedThread: session.threadId,
      },
      level: "warn",
    });

    return "❌ Use this command inside QuickAdd thread";
  }

  log.emit({
    scope: "QuickAddGuards",
    event: "guard_context_ok",
    traceId,
    data: {
      guildId,
      userId,
      channelId,
    },
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

  if (!isSessionActive(session, traceId)) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_owner_no_session",
      traceId,
      data: {
        guildId,
        userId,
      },
      level: "warn",
    });

    return "❌ No active session";
  }

  if (!isSessionOwner(userId, session, traceId)) {
    log.emit({
      scope: "QuickAddGuards",
      event: "guard_owner_mismatch",
      traceId,
      data: {
        guildId,
        userId,
        ownerId: session.ownerId,
      },
      level: "warn",
    });

    return "❌ Only session owner can use this command";
  }

  log.emit({
    scope: "QuickAddGuards",
    event: "guard_owner_ok",
    traceId,
    data: {
      guildId,
      userId,
    },
  });

  return null;
}