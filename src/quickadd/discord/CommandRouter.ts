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
 * - uses log.emit
 * - safe execution
 */

import { ChatInputCommandInteraction } from "discord.js";
import {
  getCommandHandler,
  QuickAddSubcommand,
} from "./CommandRegistry";
import { log } from "../logger";

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

    log.emit({
      event: "command_received",
      traceId,
      data: {
        userId,
        guildId,
        channelId,
        subcommand,
      },
    });

    const handler = getCommandHandler(subcommand);

    log.emit({
      event: "command_execution_start",
      traceId,
      data: { subcommand },
    });

    await handler(interaction, traceId);

    log.emit({
      event: "command_execution_done",
      traceId,
      data: {
        subcommand,
        durationMs: Date.now() - startTime,
      },
    });

  } catch (err) {
    log.emit({
      event: "command_router_error",
      traceId,
      data: { error: err },
      level: "error",
    });

    log.emit({
      event: "command_execution_failed",
      traceId,
      data: {
        durationMs: Date.now() - startTime,
      },
      level: "error",
    });
  }
}