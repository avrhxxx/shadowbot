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
 */

import {
  ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_START");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleStart(
  interaction: ChatInputCommandInteraction
): Promise<void> {
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
  // 🔒 SESSION ALREADY EXISTS
  // =====================================
  if (existing) {
    await interaction.reply({
      content: "⚠️ A session is already active",
      ephemeral: true,
    });

    log("start_blocked_existing_session", {
      guildId,
      owner: existing.ownerId,
    });

    return;
  }

  const type = interaction.options.getString("type", true);

  log("start_requested", {
    guildId,
    userId,
    type,
  });

  try {
    // =====================================
    // 📢 CREATE THREAD
    // =====================================
    const thread = await interaction.channel?.threads.create({
      name: `quickadd-${type.toLowerCase()}`,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread,
      reason: "QuickAdd session",
    });

    if (!thread) {
      throw new Error("Thread creation failed");
    }

    // =====================================
    // 👤 ADD USER TO THREAD
    // =====================================
    await thread.members.add(userId);

    // =====================================
    // 🧠 START SESSION
    // =====================================
    const session = QuickAddSession.start({
      guildId,
      threadId: thread.id,
      ownerId: userId,
      type,
    });

    log("session_started_success", session);

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

  } catch (err) {
    log.error("start_failed", err);

    await interaction.reply({
      content: "❌ Failed to start session",
      ephemeral: true,
    });
  }
}