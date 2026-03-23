// =====================================
// 📁 src/quickadd/commands/CommandHandler.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "./CommandRegistry";
import { ensureQuickAddChannel } from "../integrations/QuickAddChannelService";
import { QuickAddSession } from "../core/QuickAddSession";
import { createLogger } from "../debug/DebugLogger"; // 🔥 FIX

const log = createLogger("COMMAND"); // 🔥 FIX

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

  const channel = await ensureQuickAddChannel(interaction.guild);

  if (interaction.channelId !== channel.id) {
    log.warn("wrong_channel", {
      current: interaction.channelId,
      expected: channel.id,
    });

    return interaction.editReply({
      content: `❌ Use this command in <#${channel.id}>`,
    });
  }

  const handler = CommandRegistry[sub];

  if (!handler) {
    log.warn("unknown_subcommand", sub);

    return interaction.editReply({
      content: `❌ Unknown subcommand: ${sub}`,
    });
  }

  // 🔒 session check dla wszystkiego poza start
  if (sub !== "start") {
    const session = QuickAddSession.get(interaction.guild.id);

    if (!session) {
      log.warn("no_session");

      return interaction.editReply({
        content: "❌ No active session",
      });
    }

    if (session.ownerId !== interaction.user.id) {
      log.warn("not_owner", {
        owner: session.ownerId,
        user: interaction.user.id,
      });

      return interaction.editReply({
        content: "❌ Only session owner can use this",
      });
    }
  }

  log("handler_execute", sub);

  return handler(interaction);
}