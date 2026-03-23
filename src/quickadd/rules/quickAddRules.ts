// =====================================
// 📁 src/quickadd/rules/quickAddRules.ts
// =====================================

import { Channel, ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";

type SessionData = ReturnType<typeof QuickAddSession.get> extends infer T
  ? T extends null
    ? never
    : T
  : never;

// =====================================
// 🧠 RULE: CONTEXT
// =====================================
export function isQuickAddContext(
  channel: Channel | null,
  session: SessionData | null
): boolean {
  if (!channel || !session) return false;

  // 🔥 FIX → threadId zamiast channelId
  if (channel.id === session.threadId) {
    return true;
  }

  if ("parentId" in channel && channel.parentId === session.threadId) {
    return true;
  }

  return false;
}

// =====================================
// 🧠 RULE: SESSION
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

// =====================================
// 🧠 VALIDATOR: CONTEXT
// =====================================
export function validateQuickAddContext(
  interaction: ChatInputCommandInteraction,
  session: SessionData | null
): string | null {
  if (!isSessionActive(session)) {
    return "❌ No active session";
  }

  if (!isQuickAddContext(interaction.channel, session)) {
    return "❌ Use this command inside QuickAdd thread";
  }

  return null;
}

// =====================================
// 🧠 VALIDATOR: OWNER
// =====================================
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