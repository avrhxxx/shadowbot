// =====================================
// 📁 src/quickadd/discord/CommandRouter.ts
// =====================================

/**
 * 🎯 ROLE:
 * Entry point for handling QuickAdd slash commands.
 *
 * Responsible for:
 * - extracting subcommand
 * - resolving handler from registry
 * - executing handler safely
 *
 * ❗ RULES:
 * - NO business logic
 * - only routing + error safety
 */

import { ChatInputCommandInteraction } from "discord.js";
import { getCommandHandler } from "./CommandRegistry";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("CMD_ROUTER");

// =====================================
// 🚀 MAIN ROUTER
// =====================================

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction
) {
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
    log.trace("command_received", {
      userId,
      guildId,
      channelId,
      subcommand,
    });

    const handler = getCommandHandler(subcommand);

    // =====================================
    // ❌ UNKNOWN COMMAND
    // =====================================
    if (!handler) {
      log.warn("command_unknown", {
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
    log.trace("command_execution_start", {
      userId,
      guildId,
      channelId,
      subcommand,
    });

    await handler(interaction);

    // =====================================
    // ✅ EXECUTION DONE
    // =====================================
    log.trace("command_execution_done", {
      userId,
      guildId,
      channelId,
      subcommand,
      duration: Date.now() - startTime,
    });

  } catch (err) {
    // =====================================
    // 💥 ERROR
    // =====================================
    log.error("command_router_error", err);

    log.trace("command_execution_failed", {
      userId,
      guildId,
      channelId,
      duration: Date.now() - startTime,
    });

    // =====================================
    // 🔥 SAFE RESPONSE
    // =====================================
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