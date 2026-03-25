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
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return;

      // =====================================
      // 🎯 FILTER — ONLY /q COMMAND
      // =====================================
      if (interaction.commandName !== "q") return;

      log("interaction_received", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      await handleQuickAddInteraction(interaction);

    } catch (err) {
      log.error("listener_error", err);

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

/**
 * =====================================
 * ✅ CHANGES / PURPOSE (INDEX)
 * =====================================
 *
 * 1. 🔥 CREATED MISSING FILE
 *    → fixes:
 *      Cannot find module './quickadd/discord/QuickAddListener'
 *
 * 2. 🧠 CLEAN ARCHITECTURE
 *    - Listener ONLY listens
 *    - Router handles logic
 *
 * 3. 🎯 FILTER ADDED
 *    → only reacts to `/q`
 *
 * 4. 🛡️ SAFE ERROR HANDLING
 *    → never crashes global interaction system
 *
 * ✔ FULLY COMPATIBLE WITH:
 *   - CommandRouter
 *   - CommandRegistry
 *   - index.ts
 */