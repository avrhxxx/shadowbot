// =====================================
// 📁 src/quickadd/commands/CommandHandler.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "./CommandRegistry";
import { ensureQuickAddChannel } from "../integrations/QuickAddChannelService";
import { QuickAddSession } from "../core/QuickAddSession";
import { createLogger } from "../debug/DebugLogger";
import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../rules/quickAddRules";

const log = createLogger("COMMAND");

export async function handleQuickAddInteraction(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) return;

  log("interaction_received", {
    command: interaction.commandName,
    user: interaction.user.id,
  });

  await interaction.deferReply({ flags: 64 });

  const sub = interaction.options.getSubcommand();

  log("subcommand", sub);

  const quickAddChannel = await ensureQuickAddChannel(interaction.guild);

  const handler = CommandRegistry[sub];

  if (!handler) {
    log.warn("unknown_subcommand", sub);

    return interaction.editReply({
      content: `❌ Unknown subcommand: ${sub}`,
    });
  }

  const session = QuickAddSession.get(interaction.guild.id);

  // =====================================
  // ▶️ START — tylko w głównym kanale
  // =====================================
  if (sub === "start") {
    if (interaction.channelId !== quickAddChannel.id) {
      log.warn("start_wrong_channel", {
        current: interaction.channelId,
        expected: quickAddChannel.id,
      });

      return interaction.editReply({
        content: `❌ Use this command in <#${quickAddChannel.id}>`,
      });
    }

    log("handler_execute", sub);
    return handler(interaction);
  }

  // =====================================
  // 🔒 RESZTA — rules system (SSOT)
  // =====================================

  const contextError = validateQuickAddContext(interaction, session);
  if (contextError) {
    log.warn("blocked_context", contextError);
    return interaction.editReply({ content: contextError });
  }

  // 🔥 OWNER REQUIRED (END + CONFIRM + CANCEL)
  if (sub === "end" || sub === "confirm" || sub === "cancel") {
    const ownerError = validateSessionOwner(interaction, session);
    if (ownerError) {
      log.warn("blocked_owner", ownerError);
      return interaction.editReply({ content: ownerError });
    }
  }

  log("handler_execute", sub);

  return handler(interaction);
}