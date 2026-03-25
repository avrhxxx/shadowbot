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
import { handleQuickAddInteraction } from "./CommandRouter";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("QA_LISTENER");

// =====================================
// 🚀 REGISTER LISTENER
// =====================================

export function registerQuickAddListener(client: Client) {
  log.trace("listener_registered");

  client.on("interactionCreate", async (interaction: Interaction) => {
    const userId = interaction.isRepliable() ? interaction.user?.id : undefined;
    const guildId = "guildId" in interaction ? interaction.guildId : undefined;

    try {
      // =====================================
      // 🔍 IGNORE NON-COMMANDS (NO SPAM)
      // =====================================
      if (!interaction.isChatInputCommand()) return;

      // =====================================
      // 🎯 FILTER — ONLY /q COMMAND
      // =====================================
      if (interaction.commandName !== "q") {
        log.trace("interaction_ignored", {
          userId,
          guildId,
          command: interaction.commandName,
        });
        return;
      }

      // =====================================
      // 📥 ENTRY POINT
      // =====================================
      log.trace("interaction_received", {
        userId,
        guildId,
        command: interaction.commandName,
      });

      await handleQuickAddInteraction(interaction);

      // =====================================
      // ✅ DELEGATION DONE
      // =====================================
      log.trace("interaction_handled", {
        userId,
        guildId,
      });

    } catch (err) {
      // =====================================
      // 💥 ERROR
      // =====================================
      log.error("listener_error", err, undefined);

      log.trace("interaction_failed", {
        userId,
        guildId,
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