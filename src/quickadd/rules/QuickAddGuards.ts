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

export function isSessionActive(session: SessionData | null): boolean {
  return !!session;
}

export function isSessionOwner(
  userId: string,
  session: SessionData | null
): boolean {
  return session?.ownerId === userId;
}

export function isInQuickAddThread(
  channel: Channel | null,
  session: SessionData | null
): boolean {
  if (!channel || !session) return false;

  // 🔥 główny thread
  if (channel.id === session.threadId) {
    return true;
  }

  // 🔥 child (np. thread message)
  if ("parentId" in channel && channel.parentId === session.threadId) {
    return true;
  }

  return false;
}

// =====================================
// 🧠 VALIDATORS (USER-FACING)
// =====================================

export function validateQuickAddContext(
  interaction: ChatInputCommandInteraction,
  session: SessionData | null
): string | null {
  if (!isSessionActive(session)) {
    return "❌ No active session";
  }

  if (!isInQuickAddThread(interaction.channel, session)) {
    return "❌ Use this command inside QuickAdd thread";
  }

  return null;
}

export function validateSessionOwner(
  interaction: ChatInputCommandInteraction,
  session: SessionData | null
): string | null {
  if (!isSessionActive(session)) {
    return "❌ No active session";
  }

  if (!isSessionOwner(interaction.user.id, session)) {
    return "❌ Only session owner can use this command";
  }

  return null;
}