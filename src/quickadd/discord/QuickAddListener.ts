// =====================================
// 📁 src/quickadd/discord/QuickAddListener.ts
// =====================================

/**
 * 🎧 ROLE:
 * Registers QuickAdd interaction listener.
 *
 * ❗ RULES:
 * - ENTRYPOINT → MUST create traceId
 * - NO business logic
 * - ONLY routing
 *
 * ✅ FINAL:
 * - traceId generated HERE (correct layer)
 * - fully compatible with logger system
 */

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createScopedLogger } from "@/quickadd/debug/logger";
import { createTraceId } from "../core/IdGenerator";

// 🔥 NEW (autocomplete handler)
import { handleConfirmAutocomplete } from "./actions/confirm/confirmAutocomplete";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 REGISTER LISTENER
// =====================================

export function registerQuickAddListener(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    const traceId = createTraceId();

    const userId = interaction.user?.id;
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;

    try {
      // =====================================
      // 🔥 AUTOCOMPLETE HANDLER
      // =====================================
      if (interaction.isAutocomplete()) {
        if (interaction.commandName !== "q") return;

        log.trace("autocomplete_received", traceId, {
          userId,
          guildId,
          channelId,
        });

        await handleConfirmAutocomplete(interaction, traceId);
        return;
      }

      // =====================================
      // 🔹 COMMAND HANDLER
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