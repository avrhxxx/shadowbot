// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

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

  let subcommand: QuickAddSubcommand | null = null;

  try {
    // 🔒 SAFE SUBCOMMAND
    try {
      subcommand =
        interaction.options.getSubcommand() as QuickAddSubcommand;
    } catch {
      log.emit({
        event: "command_subcommand_missing",
        traceId,
        level: "error",
        data: { userId, guildId, channelId },
      });
      return;
    }

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

    // 🔒 HANDLER GUARD
    if (!handler) {
      log.emit({
        event: "command_handler_missing",
        traceId,
        level: "error",
        data: { subcommand },
      });
      return;
    }

    // =====================================
    // 🔥 CRITICAL: ACK FIRST (Discord rule)
    // =====================================
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

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

  } catch (err: any) {
    log.emit({
      event: "command_router_error",
      traceId,
      level: "error",
      data: {
        subcommand,
        error: {
          message: err?.message || "unknown",
          stack: err?.stack,
        },
      },
    });

    log.emit({
      event: "command_execution_failed",
      traceId,
      level: "error",
      data: {
        subcommand,
        durationMs: Date.now() - startTime,
      },
    });

    // 🔥 FAILSAFE RESPONSE (Discord safety)
    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Command failed.",
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}