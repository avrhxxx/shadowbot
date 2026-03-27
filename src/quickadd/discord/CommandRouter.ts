// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

/**
 * 🎯 ROLE:
 * Command router + traceId injector
 */

import { ChatInputCommandInteraction } from "discord.js";
import {
  getCommandHandler,
  QuickAddSubcommand,
} from "./CommandRegistry";
import { createScopedLogger } from "@/quickadd/debug/logger";
import { createTraceId } from "../core/IdGenerator";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 MAIN ROUTER
// =====================================

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.isChatInputCommand()) return;

  const traceId = createTraceId();

  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  const startTime = Date.now();

  try {
    const subcommand =
      interaction.options.getSubcommand() as QuickAddSubcommand;

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

    // =====================================
    // 🚀 EXECUTION START
    // =====================================
    log.trace("command_execution_start", traceId, {
      userId,
      guildId,
      channelId,
      subcommand,
    });

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
    log.error("command_router_error", err, traceId);

    log.trace("command_execution_failed", traceId, {
      userId,
      guildId,
      channelId,
      durationMs: Date.now() - startTime,
    });
  }
}