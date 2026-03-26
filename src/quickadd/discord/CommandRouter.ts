// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

/**
 * 🎯 ROLE:
 * Command router + traceId injector
 *
 * ❗ RULES:
 * - generates traceId (via IdGenerator)
 * - injects into handlers
 * - no business logic
 */

import { ChatInputCommandInteraction } from "discord.js";
import { getCommandHandler } from "./CommandRegistry";
import { createScopedLogger } from "@/quickadd/debug/logger";
import { createTraceId } from "../core/IdGenerator";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 MAIN ROUTER
// =====================================

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction
) {
  const traceId = createTraceId();

  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  const startTime = Date.now();

  try {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    // =====================================
    // 📥 INPUT
    // =====================================
    log.trace("command_received", traceId, {
      userId,
      guildId,
      channelId,
      subcommand,
    });

    const handler = getCommandHandler(subcommand);

    if (!handler) {
      log.trace("command_unknown", traceId, {
        userId,
        guildId,
        channelId,
        subcommand,
      });

      await interaction.reply({
        content: "❌ Unknown command",
        ephemeral: true,
      });

      return;
    }

    // =====================================
    // 🚀 EXECUTION START
    // =====================================
    log.trace("command_execution_start", traceId, {
      userId,
      guildId,
      channelId,
      subcommand,
    });

    // 🔥 TRACE INJECTION (TEMP — FIX IN NEXT PHASE)
    await (handler as any)(interaction, traceId);

    // =====================================
    // ✅ EXECUTION DONE
    // =====================================
    log.trace("command_execution_done", traceId, {
      userId,
      guildId,
      channelId,
      subcommand,
      durationMs: Date.now() - startTime,
    });

  } catch (err) {
    // =====================================
    // 💥 ERROR
    // =====================================
    log.error("command_router_error", err, traceId);

    log.trace("command_execution_failed", traceId, {
      userId,
      guildId,
      channelId,
      durationMs: Date.now() - startTime,
    });
  }
}