// =====================================
// 📁 src/quickadd/discord/actions/start/start.ts
// =====================================

/**
 * ⚙️ ROLE:
 * Starts a new QuickAdd session.
 *
 * Responsible for:
 * - validating no active session exists
 * - creating a private thread
 * - initializing session state
 *
 * ❗ RULES:
 * - minimal logic (delegates to session layer)
 * - handles Discord-specific operations (thread)
 * - MUST produce traceId
 * - FULL trace logging AFTER session start
 */

import {
  ChatInputCommandInteraction,
  ChannelType,
  TextChannel,
} from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_START");

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
  interaction: ChatInputCommandInteraction
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
    log.trace("start_blocked_existing_session", existing.traceId, {
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

  try {
    // =====================================
    // 📢 CHANNEL GUARD
    // =====================================
    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      throw new Error("Invalid channel type for thread creation");
    }

    // =====================================
    // 📢 CREATE THREAD
    // =====================================
    const thread = await interaction.channel.threads.create({
      name: `quickadd-${type.toLowerCase()}`,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread,
      reason: "QuickAdd session",
    });

    // =====================================
    // 👤 ADD USER
    // =====================================
    await thread.members.add(userId);

    // =====================================
    // 🧠 START SESSION (TRACE STARTS HERE)
    // =====================================
    const session = QuickAddSession.start({
      guildId,
      threadId: thread.id,
      ownerId: userId,
      type,
    });

    const traceId = session.traceId;

    // =====================================
    // 🔍 LOG START
    // =====================================
    log.trace("start_start", traceId, {
      guildId,
      userId,
      threadId: thread.id,
      type,
    });

    log.trace("thread_created", traceId, {
      threadId: thread.id,
    });

    log.trace("thread_member_added", traceId, {
      userId,
    });

    log.trace("session_started", traceId, {
      guildId,
      ownerId: userId,
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
      content: `🚀 QuickAdd session started\n\nSend screenshots here.`,
    });

    log.trace("start_done", traceId, {
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("start_failed", err);

    await interaction.reply({
      content: "❌ Failed to start session",
      ephemeral: true,
    });
  }
}