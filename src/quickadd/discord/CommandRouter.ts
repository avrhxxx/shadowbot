// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

/**
 * 🎯 ROLE:
 * Routes commands to handlers
 *
 * ❗ RULES:
 * - NO ID generation
 * - traceId MUST be injected
 * - NO business logic
 *
 * ✅ FINAL:
 * - logger standardized
 * - safe execution
 */

import { ChatInputCommandInteraction } from "discord.js";
import {
  getCommandHandler,
  QuickAddSubcommand,
} from "./CommandRegistry";
import { createScopedLogger } from "../debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 ROUTER
// =====================================

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction,
  traceId: string
) {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  const startTime = Date.now();

  try {
    const subcommand =
      interaction.options.getSubcommand() as QuickAddSubcommand;

    log.trace("command_received", traceId, {
      userId,
      guildId,
      channelId,
      subcommand,
    });

    const handler = getCommandHandler(subcommand);

    log.trace("command_execution_start", traceId, {
      subcommand,
    });

    await handler(interaction, traceId);

    log.trace("command_execution_done", traceId, {
      subcommand,
      durationMs: Date.now() - startTime,
    });

  } catch (err) {
    log.error("command_router_error", err, traceId);

    log.trace("command_execution_failed", traceId, {
      durationMs: Date.now() - startTime,
    });
  }
}