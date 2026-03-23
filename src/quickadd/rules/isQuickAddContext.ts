// =====================================
// 📁 src/quickadd/rules/isQuickAddContext.ts
// =====================================

import { Channel } from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";

// 🔥 INTERNAL TYPE (zgodny z session store)
type SessionData = ReturnType<typeof QuickAddSession.get> extends infer T
  ? T extends null
    ? never
    : T
  : never;

/**
 * =====================================
 * 🧠 RULE: isQuickAddContext
 * =====================================
 *
 * ✔️ Allows:
 * - main QuickAdd channel
 * - threads created inside that channel
 *
 * ❌ Blocks:
 * - other channels
 * - DMs
 */
export function isQuickAddContext(
  channel: Channel | null,
  session: SessionData | null
): boolean {
  if (!channel || !session) return false;

  // 🔥 MAIN CHANNEL
  if (channel.id === session.channelId) {
    return true;
  }

  // 🔥 THREAD (belongs to QuickAdd channel)
  if ("parentId" in channel && channel.parentId === session.channelId) {
    return true;
  }

  return false;