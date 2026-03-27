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
 * - uses log.emit
 * - proper autocomplete routing
 */

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createTraceId } from "../core/IdGenerator";
import { handleConfirmAutocomplete } from "./actions/confirm/confirmAutocomplete";
import { log } from "../logger";

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

        log.emit({
          event: "autocomplete_received",
          traceId,
          data: {
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

      log.emit({
        event: "interaction_received",
        traceId,
        data: {
          userId,
          guildId,
          channelId,
        },
      });

      await handleQuickAddCommand(interaction, traceId);

    } catch (err) {
      log.emit({
        event: "listener_error",
        traceId,
        data: { error: err },
        level: "error",
      });

      if (interaction.isRepliable()) {
        await interaction
          .reply({
            content: "❌ QuickAdd listener error",
            ephemeral: true,
          })
          .catch(() => null);
      }
    }
  });
}