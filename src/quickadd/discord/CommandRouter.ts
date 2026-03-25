// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

/**
 * 🎯 ROLE:
 * Command router + traceId injector
 *
 * ❗ RULES:
 * - generates traceId
 * - injects into handlers
 * - no business logic
 */

import { ChatInputCommandInteraction } from "discord.js";
import { getCommandHandler } from "./CommandRegistry";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("CMD_ROUTER");

// =====================================
// 🔥 TRACE ID GENERATOR
// =====================================

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// =====================================
// 🚀 MAIN ROUTER
// =====================================

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction
) {
  const traceId = generateTraceId();

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
      log.warn("command_unknown", {
        traceId,
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

    // 🔥 TRACE INJECTION
    await handler(interaction, traceId);

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

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "❌ Something went wrong",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ Something went wrong",
        ephemeral: true,
      });
    }
  }
}