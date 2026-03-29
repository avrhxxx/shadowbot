// =====================================
// 📁 src/system/quickadd/discord/CommandRouter.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import {
  getCommandHandler,
  QuickAddSubcommand,
} from "./CommandRegistry";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

// =====================================
// 🚀 ROUTER
// =====================================

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
) {
  if (!interaction.isChatInputCommand()) return;

  const l = log.ctx(ctx);

  const userId = interaction.user.id;
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  const startTime = Date.now();

  let subcommand: QuickAddSubcommand | null = null;

  try {
    try {
      subcommand =
        interaction.options.getSubcommand() as QuickAddSubcommand;
    } catch {
      l.error("subcommand_missing", {
        userId,
        guildId,
        channelId,
      });

      return;
    }

    l.event("received", {
      userId,
      guildId,
      channelId,
      subcommand,
    });

    const handler = getCommandHandler(subcommand, ctx);

    if (!handler) {
      l.error("handler_missing", {
        subcommand,
      });

      if (interaction.isRepliable()) {
        const payload = {
          content: "❌ Command not supported.",
          ephemeral: true,
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }

      return;
    }

    // =====================================
    // 🔥 CRITICAL: ACK FIRST (Discord rule)
    // =====================================
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    l.event("execution_start", {
      subcommand,
    });

    await handler(interaction, ctx);

    const durationMs = Date.now() - startTime;

    l.event("execution_done", {
      subcommand,
    }, {
      durationMs,
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;

    l.error("execution_failed", {
      subcommand: subcommand ?? "unknown",
      durationMs,
      error,
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Command failed.",
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}