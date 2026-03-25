// =====================================
// 📁 src/quickadd/integrations/QuickAddChannelManager.ts
// =====================================

/**
 * 📢 ROLE:
 * Ensures QuickAdd channel exists in guild.
 *
 * Responsible for:
 * - finding existing channel
 * - creating if missing
 *
 * ❗ RULES:
 * - no business logic
 * - no session logic
 */

import {
  Guild,
  ChannelType,
  TextChannel,
} from "discord.js";

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("CHANNEL");

// =====================================
// 📌 CONFIG
// =====================================

const CHANNEL_NAME = "quickadd";

// =====================================
// 🚀 MAIN
// =====================================

export async function ensureQuickAddChannel(
  guild: Guild
): Promise<TextChannel> {
  // =====================================
  // 🔍 FIND EXISTING
  // =====================================
  const existing = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === CHANNEL_NAME
  ) as TextChannel | undefined;

  if (existing) {
    log.trace("channel_found", {
      guildId: guild.id,
      channelId: existing.id,
    });

    return existing;
  }

  // =====================================
  // 🏗️ CREATE CHANNEL
  // =====================================
  const created = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
  });

  log.trace("channel_created", {
    guildId: guild.id,
    channelId: created.id,
  });

  return created;
}