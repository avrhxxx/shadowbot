// =====================================
// 📁 src/quickadd/discord/QuickAddListener.ts
// =====================================

/**
 * 🎧 ROLE:
 * Registers QuickAdd interaction listener.
 *
 * Responsible for:
 * - listening to Discord interactions
 * - filtering QuickAdd command
 * - delegating to CommandRouter
 *
 * ❗ RULES:
 * - NO business logic
 * - NO parsing
 * - ONLY routing
 */

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 REGISTER LISTENER
// =====================================

export function registerQuickAddListener(client: Client) {
  // 🔧 FIX: no traceId allowed here → use base logger (non-trace)
  log("listener_registered", {});

  client.on("interactionCreate", async (interaction: Interaction) => {
    const userId = interaction.isRepliable()
      ? interaction.user?.id
      : undefined;

    const guildId =
      "guildId" in interaction ? interaction.guildId : undefined;

    const channelId =
      "channelId" in interaction ? interaction.channelId : undefined;

    try {
      // =====================================
      // 🔍 IGNORE NON-COMMANDS
      // =====================================
      if (!interaction.isChatInputCommand()) return;

      // =====================================
      // 🎯 FILTER — ONLY /q COMMAND
      // =====================================
      if (interaction.commandName !== "q") {
        return;
      }

      // =====================================
      // 📥 ENTRY POINT
      // =====================================
      log("interaction_received", {
        userId,
        guildId,
        channelId,
        command: interaction.commandName,
      });

      // =====================================
      // 🔁 DELEGATION
      // =====================================
      await handleQuickAddCommand(interaction);

    } catch (err) {
      // =====================================
      // 💥 ERROR
      // =====================================
      log.warn("listener_error", {
        userId,
        guildId,
        channelId,
        error: err,
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