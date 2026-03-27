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
 *
 * 🔥 LOGGER UPDATE:
 * - uses createScopedLogger
 * - SYSTEM traceId generated locally
 */

import {
  Guild,
  ChannelType,
  TextChannel,
} from "discord.js";

import { createScopedLogger } from "@/quickadd/debug/logger";
import { createTraceId } from "../core/IdGenerator";

const log = createScopedLogger(import.meta.url);

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
  const traceId = createTraceId(); // 🔥 SYSTEM TRACE
  const guildId = guild.id;

  log.trace("channel_ensure_start", traceId, {
    guildId,
    expectedName: CHANNEL_NAME,
  });

  // =====================================
  // 🔍 FIND EXISTING
  // =====================================
  const existing = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === CHANNEL_NAME
  ) as TextChannel | undefined;

  if (existing) {
    log.trace("channel_found", traceId, {
      guildId,
      channelId: existing.id,
      name: existing.name,
    });

    return existing;
  }

  // =====================================
  // 🏗️ CREATE CHANNEL
  // =====================================
  log.trace("channel_create_start", traceId, {
    guildId,
    name: CHANNEL_NAME,
  });

  const created = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
  });

  log.trace("channel_created", traceId, {
    guildId,
    channelId: created.id,
    name: created.name,
  });

  return created;
}