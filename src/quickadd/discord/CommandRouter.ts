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
  try {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    log("command_received", {
      user: interaction.user.id,
      guild: interaction.guildId,
      subcommand,
    });

    const handler = getCommandHandler(subcommand);

    if (!handler) {
      log.warn("unknown_subcommand", { subcommand });

      await interaction.reply({
        content: "❌ Unknown command",
        ephemeral: true,
      });

      return;
    }

    // =====================================
    // 🔥 EXECUTE HANDLER
    // =====================================
    await handler(interaction);

  } catch (err) {
    log.error("command_router_error", err);

    // 🔥 SAFE RESPONSE
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