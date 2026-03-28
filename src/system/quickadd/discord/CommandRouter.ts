// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import {
  getCommandHandler,
  QuickAddSubcommand,
} from "./CommandRegistry";
import { logger } from "../../core/logger/log";

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
      logger.emit({
        scope: "quickadd.command_router",
        event: "subcommand_missing",
        traceId,
        level: "error",
        context: { userId, guildId, channelId },
      });

      return;
    }

    logger.emit({
      scope: "quickadd.command_router",
      event: "received",
      traceId,
      context: {
        userId,
        guildId,
        channelId,
        subcommand,
      },
    });

    const handler = getCommandHandler(subcommand);

    // 🔒 HANDLER GUARD (defensive, choć TS powinien chronić)
    if (!handler) {
      logger.emit({
        scope: "quickadd.command_router",
        event: "handler_missing",
        traceId,
        level: "error",
        context: { subcommand },
      });

      if (interaction.isRepliable()) {
        const payload = {
          content: "❌ Command not supported.",
          ephemeral: true,
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }

      return;
    }

    // =====================================
    // 🔥 CRITICAL: ACK FIRST (Discord rule)
    // =====================================
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    logger.emit({
      scope: "quickadd.command_router",
      event: "execution_start",
      traceId,
      context: { subcommand },
    });

    await handler(interaction, traceId);

    const durationMs = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.command_router",
      event: "execution_done",
      traceId,
      context: { subcommand },
      result: { durationMs },
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.command_router",
      event: "execution_failed",
      traceId,
      level: "error",
      context: {
        subcommand: subcommand ?? "unknown",
      },
      result: { durationMs },
      error,
    });

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