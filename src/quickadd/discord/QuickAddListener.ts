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
    const channelId = "channelId" in interaction ? interaction.channelId : undefined;

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
          channelId,
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
        channelId,
        command: interaction.commandName,
      });

      // =====================================
      // 🔁 DELEGATION
      // =====================================
      log.trace("interaction_delegate_to_router", {
        userId,
        guildId,
        channelId,
      });

      await handleQuickAddInteraction(interaction);

      // =====================================
      // ✅ DELEGATION DONE
      // =====================================
      log.trace("interaction_handled", {
        userId,
        guildId,
        channelId,
      });

    } catch (err) {
      // =====================================
      // 💥 ERROR
      // =====================================
      log.error("listener_error", err);

      log.trace("interaction_failed", {
        userId,
        guildId,
        channelId,
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