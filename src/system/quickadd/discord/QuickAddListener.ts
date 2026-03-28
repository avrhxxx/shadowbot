// =====================================
// 📁 src/system/quickadd/discord/QuickAddListener.ts
// =====================================

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { handleConfirmAutocomplete } from "./actions/confirm/confirmAutocomplete";
import { logger } from "../../../core/logger/log";

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

        let subcommand: string | null = null;

        try {
          subcommand = interaction.options.getSubcommand();
        } catch {
          logger.emit({
            scope: "quickadd.listener",
            event: "autocomplete_subcommand_missing",
            traceId,
            level: "warn",
            context: { userId, guildId, channelId },
          });

          await interaction.respond([]);
          return;
        }

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
        } else {
          await interaction.respond([]);
        }

        logger.emit({
          scope: "quickadd.listener",
          event: "autocomplete_handled",
          traceId,
          context: {
            subcommand,
          },
        });

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

      logger.emit({
        scope: "quickadd.listener",
        event: "interaction_routed",
        traceId,
        context: {
          userId,
          guildId,
        },
      });

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