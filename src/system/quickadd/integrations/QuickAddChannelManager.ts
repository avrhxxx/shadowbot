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
 * 🔥 LOGGER:
 * - uses logger.emit ONLY
 */

import {
  Guild,
  ChannelType,
  TextChannel,
} from "discord.js";

import { logger } from "../core/logger/log";
import { createTraceId } from "../core/IdGenerator";

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
  const startTime = Date.now();

  logger.emit({
    event: "channel_ensure_start",
    traceId,
    context: {
      guildId,
      expectedName: CHANNEL_NAME,
    },
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
    const duration = Date.now() - startTime;

    logger.emit({
      event: "channel_found",
      traceId,
      context: {
        guildId,
        channelId: existing.id,
        name: existing.name,
      },
      stats: {
        durationMs: duration,
        channel_found: 1,
      },
    });

    return existing;
  }

  // =====================================
  // 🏗️ CREATE CHANNEL
  // =====================================
  logger.emit({
    event: "channel_create_start",
    traceId,
    context: {
      guildId,
      name: CHANNEL_NAME,
    },
  });

  const created = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
  });

  const duration = Date.now() - startTime;

  logger.emit({
    event: "channel_created",
    traceId,
    context: {
      guildId,
      channelId: created.id,
      name: created.name,
    },
    stats: {
      durationMs: duration,
      channel_created: 1,
    },
  });

  return created;
}