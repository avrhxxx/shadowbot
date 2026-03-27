// =====================================
// 📁 src/quickadd/discord/actions/start/start.ts
// =====================================

/**
 * ⚙️ ROLE:
 * Starts a new QuickAdd session.
 *
 * ❗ RULES:
 * - NO import aliases
 * - traceId injected ONLY
 * - CJS SAFE (__filename)
 * - no duplicate logs vs core
 * - cleanup on failure
 */

import {
  ChatInputCommandInteraction,
  ChannelType,
  TextChannel,
} from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";
import { createScopedLogger } from "../../../debug/logger";

// ✅ GLOBAL RULE — CJS SAFE
const log = createScopedLogger(__filename);

// =====================================
// 🔹 TYPE GUARD
// =====================================

function isQuickAddType(value: string): value is QuickAddType {
  return [
    "DONATIONS_POINTS",
    "DUEL_POINTS",
    "RR_SIGNUPS",
    "RR_RESULTS",
  ].includes(value);
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleStart(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const existing = QuickAddSession.get(guildId);

  // =====================================
  // 🔒 SESSION EXISTS
  // =====================================
  if (existing) {
    log.trace("start_blocked_existing_session", traceId, {
      guildId,
      owner: existing.ownerId,
    });

    await interaction.reply({
      content: "⚠️ A session is already active",
      ephemeral: true,
    });

    return;
  }

  const rawType = interaction.options.getString("type", true);

  if (!isQuickAddType(rawType)) {
    await interaction.reply({
      content: "❌ Invalid QuickAdd type",
      ephemeral: true,
    });
    return;
  }

  const type: QuickAddType = rawType;

  let createdThreadId: string | null = null;

  try {
    // =====================================
    // 📢 CHANNEL GUARD (Discord.js safe)
    // =====================================
    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      throw new Error("Invalid channel type");
    }

    // =====================================
    // 🧵 CREATE THREAD
    // =====================================
    const thread = await interaction.channel.threads.create({
      name: `quickadd-${type.toLowerCase()}`,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread,
      reason: "QuickAdd session",
    });

    createdThreadId = thread.id;

    await thread.members.add(userId);

    // =====================================
    // 🧠 START SESSION
    // =====================================
    const session = QuickAddSession.start(
      {
        guildId,
        threadId: thread.id,
        ownerId: userId,
        type,
      },
      traceId
    );

    // ❗ HARD GUARD (MANDATORY)
    if (!session) {
      log.error(
        "start_session_null",
        new Error("Session creation failed"),
        traceId
      );

      try {
        await thread.delete();
      } catch {}

      await interaction.reply({
        content: "❌ Failed to start session",
        ephemeral: true,
      });

      return;
    }

    // =====================================
    // 🔍 LOG (NO DUPLICATES)
    // =====================================
    log.trace("start_initialized", traceId, {
      sessionId: session.sessionId,
      guildId,
      threadId: thread.id,
      userId,
      type,
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: `✅ QuickAdd started\n📍 Thread: <#${thread.id}>`,
      ephemeral: true,
    });

    await thread.send({
      content: "🚀 QuickAdd session started\n\nSend screenshots here.",
    });

    log.trace("start_done", traceId, {
      sessionId: session.sessionId,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("start_failed", err, traceId);

    // ❗ CLEANUP ORPHAN THREAD
    if (createdThreadId && interaction.channel instanceof TextChannel) {
      try {
        const thread = await interaction.channel.threads.fetch(createdThreadId);
        await thread?.delete();
      } catch {}
    }

    await interaction.reply({
      content: "❌ Failed to start session",
      ephemeral: true,
    });
  }
}