// =====================================
// 📁 src/quickadd/discord/QuickAddListener.ts
// =====================================

/**
 * 🎧 ROLE:
 * Entry point for QuickAdd interactions
 *
 * ❗ RULES:
 * - MUST create traceId
 * - NO business logic
 * - ONLY routing
 *
 * ✅ FINAL:
 * - uses logger.emit
 * - proper autocomplete routing
 * - SAFE reply handling (🔥 FIX 40060 / 10062)
 */

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createTraceId } from "../core/IdGenerator";
import { handleConfirmAutocomplete } from "./actions/confirm/confirmAutocomplete";
import { logger } from "../../core/logger/log";

// =====================================
// 🚀 REGISTER
// =====================================

export function registerQuickAddListener(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    const traceId = createTraceId();

    const userId = interaction.user?.id;
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;

    try {
      // =====================================
      // 🔥 AUTOCOMPLETE
      // =====================================
      if (interaction.isAutocomplete()) {
        if (interaction.commandName !== "q") return;

        const subcommand = interaction.options.getSubcommand();

        logger.emit({
          scope: "quickadd.listener",
          event: "autocomplete_received",
          traceId,
          context: {
            userId,
            guildId,
            channelId,
            subcommand,
          },
        });

        if (subcommand === "confirm") {
          await handleConfirmAutocomplete(interaction, traceId);
        }

        return;
      }

      // =====================================
      // 🔹 COMMAND
      // =====================================
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName !== "q") return;

      logger.emit({
        scope: "quickadd.listener",
        event: "interaction_received",
        traceId,
        context: {
          userId,
          guildId,
          channelId,
        },
      });

      await handleQuickAddCommand(interaction, traceId);

    } catch (error) {
      logger.emit({
        scope: "quickadd.listener",
        event: "listener_error",
        traceId,
        level: "error",
        context: {
          userId,
          guildId,
          channelId,
        },
        error,
      });

      // =====================================
      // 🔥 SAFE RESPONSE (NO DOUBLE REPLY)
      // =====================================
      if (interaction.isRepliable()) {
        try {
          if (interaction.deferred) {
            await interaction.editReply({
              content: "❌ QuickAdd listener error",
            });
          } else if (!interaction.replied) {
            await interaction.reply({
              content: "❌ QuickAdd listener error",
              ephemeral: true,
            });
          }
        } catch {
          // ignore Discord hard errors
        }
      }
    }
  });
}