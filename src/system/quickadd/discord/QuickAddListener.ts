// =====================================
// 📁 src/system/quickadd/discord/QuickAddListener.ts
// =====================================

import { Client, Interaction } from "discord.js";
import { handleQuickAddCommand } from "./CommandRouter";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { handleConfirmAutocomplete } from "./actions/confirm/confirmAutocomplete";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

// =====================================
// 🚀 REGISTER
// =====================================

export function registerQuickAddListener(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    const traceId = createTraceId();

    // 🔥 TEMP ctx creation (entrypoint)
    const ctx = {
      traceId,
      system: "quickadd",
    } as TraceContext;

    const l = log.ctx(ctx);

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
          l.warn("autocomplete_subcommand_missing", {
            userId,
            guildId,
            channelId,
          });

          await interaction.respond([]);
          return;
        }

        l.event("autocomplete_received", {
          userId,
          guildId,
          channelId,
          subcommand,
        });

        if (subcommand === "confirm") {
          await handleConfirmAutocomplete(interaction, ctx);
        } else {
          await interaction.respond([]);
        }

        l.event("autocomplete_handled", {
          subcommand,
        });

        return;
      }

      // =====================================
      // 🔹 COMMAND
      // =====================================
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName !== "q") return;

      l.event("interaction_received", {
        userId,
        guildId,
        channelId,
      });

      await handleQuickAddCommand(interaction, ctx);

      l.event("interaction_routed", {
        userId,
        guildId,
      });

    } catch (error) {
      l.error("listener_error", {
        userId,
        guildId,
        channelId,
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