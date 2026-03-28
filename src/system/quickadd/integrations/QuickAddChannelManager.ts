// =====================================
// 📁 src/quickadd/integrations/QuickAddChannelManager.ts
// =====================================

import {
  Guild,
  ChannelType,
  TextChannel,
} from "discord.js";

import { logger } from "../../../core/logger/log";
import { createTraceId } from "../../../core/ids/IdGenerator";

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
  const traceId = createTraceId();
  const guildId = guild.id;
  const startTime = Date.now();

  logger.emit({
    scope: "quickadd.channel",
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
      scope: "quickadd.channel",
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
    scope: "quickadd.channel",
    event: "channel_create_start",
    traceId,
    context: {
      guildId,
      name: CHANNEL_NAME,
    },
  });

  try {
    const created = await guild.channels.create({
      name: CHANNEL_NAME,
      type: ChannelType.GuildText,
    });

    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.channel",
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

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.channel",
      event: "channel_create_failed",
      traceId,
      level: "error",
      context: {
        guildId,
        name: CHANNEL_NAME,
      },
      stats: {
        durationMs: duration,
        channel_create_error: 1,
      },
      error,
    });

    throw error; // 🔥 ważne: NIE połykamy błędu
  }
}