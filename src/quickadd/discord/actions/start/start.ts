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
  TextChannel, // ✅ FIX — needed for narrowing
} from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes"; // ✅ FIX — type safety
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_START");

// =====================================
// 🔹 TYPE GUARD (SAFE CAST)
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

  const rawType = interaction.options.getString("type", true);

  // =====================================
  // 🔒 VALIDATE TYPE
  // =====================================
  if (!isQuickAddType(rawType)) {
    await interaction.reply({
      content: "❌ Invalid QuickAdd type",
      ephemeral: true,
    });
    return;
  }

  const type: QuickAddType = rawType;

  log("start_requested", {
    guildId,
    userId,
    type,
  });

  try {
    // =====================================
    // 📢 CHANNEL TYPE GUARD
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

/**
 * =====================================
 * ✅ CHANGES (INDEX)
 * =====================================
 *
 * 1. 🔥 FIX — threads.create ERROR
 *    BEFORE:
 *      interaction.channel?.threads.create(...)
 *
 *    AFTER:
 *      if (!(interaction.channel instanceof TextChannel)) throw
 *
 *    ✔ Proper type narrowing
 *    ✔ Fixes TS2339
 *
 * 2. 🔥 FIX — QuickAddType mismatch
 *    BEFORE:
 *      const type = string
 *
 *    AFTER:
 *      validated via type guard → QuickAddType
 *
 *    ✔ Fixes TS2322
 *
 * 3. 🧠 ADDED TYPE GUARD
 *    isQuickAddType()
 *
 *    ✔ prevents runtime invalid values
 *    ✔ keeps domain consistency
 *
 * 4. ❗ NO ARCHITECTURE VIOLATION
 *    - still no business logic
 *    - only validation + Discord handling
 *
 * ✔ FILE FULLY FIXED
 */