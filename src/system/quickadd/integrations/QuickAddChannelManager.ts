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
 * - uses log.emit ONLY
 * - system-level logs (type: "system")
 */

import {
  Guild,
  ChannelType,
  TextChannel,
} from "discord.js";

import { log } from "../logger";
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

  log.emit({
    event: "channel_ensure_start",
    traceId,
    type: "system",
    data: {
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
    log.emit({
      event: "channel_found",
      traceId,
      type: "system",
      data: {
        guildId,
        channelId: existing.id,
        name: existing.name,
      },
    });

    return existing;
  }

  // =====================================
  // 🏗️ CREATE CHANNEL
  // =====================================
  log.emit({
    event: "channel_create_start",
    traceId,
    type: "system",
    data: {
      guildId,
      name: CHANNEL_NAME,
    },
  });

  const created = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
  });

  log.emit({
    event: "channel_created",
    traceId,
    type: "system",
    data: {
      guildId,
      channelId: created.id,
      name: created.name,
    },
  });

  return created;
}