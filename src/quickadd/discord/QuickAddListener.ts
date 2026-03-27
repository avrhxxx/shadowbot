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
 * - Node-safe imports
 * - proper autocomplete routing
 */

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createScopedLogger } from "../debug/logger";
import { createTraceId } from "../core/IdGenerator";

import { handleConfirmAutocomplete } from "./actions/confirm/confirmAutocomplete";

const log = createScopedLogger(import.meta.url);

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

        log.trace("autocomplete_received", traceId, {
          userId,
          guildId,
          channelId,
          subcommand,
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

      log.trace("interaction_received", traceId, {
        userId,
        guildId,
        channelId,
      });

      await handleQuickAddCommand(interaction, traceId);

    } catch (err) {
      log.error("listener_error", err, traceId);

      if (interaction.isRepliable()) {
        await interaction.reply({
          content: "❌ QuickAdd listener error",
          ephemeral: true,
        }).catch(() => null);
      }
    }
  });
}