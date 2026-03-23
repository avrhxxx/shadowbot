// =====================================
// 📁 src/quickadd/commands/CommandHandler.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "./CommandRegistry";
import { ensureQuickAddChannel } from "../integrations/QuickAddChannelService";
import { QuickAddSession } from "../core/QuickAddSession";
import { debug } from "../debug/DebugLogger"; // 🔥 NEW

const SCOPE = "COMMAND"; // 🔥 NEW

export async function handleQuickAddInteraction(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) return;

  debug(SCOPE, "INTERACTION_RECEIVED", {
    command: interaction.commandName,
    user: interaction.user.id,
  });

  await interaction.deferReply({ flags: 64 });

  const sub = interaction.options.getSubcommand();

  debug(SCOPE, "SUBCOMMAND", sub);

  const channel = await ensureQuickAddChannel(interaction.guild);

  if (interaction.channelId !== channel.id) {
    debug(SCOPE, "WRONG_CHANNEL", {
      current: interaction.channelId,
      expected: channel.id,
    });

    return interaction.editReply({
      content: `❌ Use this command in <#${channel.id}>`,
    });
  }

  const handler = CommandRegistry[sub];

  if (!handler) {
    debug(SCOPE, "UNKNOWN_SUBCOMMAND", sub);

    return interaction.editReply({
      content: `❌ Unknown subcommand: ${sub}`,
    });
  }

  // 🔒 session check dla wszystkiego poza start
  if (sub !== "start") {
    const session = QuickAddSession.get(interaction.guild.id);

    if (!session) {
      debug(SCOPE, "NO_SESSION");

      return interaction.editReply({
        content: "❌ No active session",
      });
    }

    if (session.ownerId !== interaction.user.id) {
      debug(SCOPE, "NOT_OWNER", {
        owner: session.ownerId,
        user: interaction.user.id,
      });

      return interaction.editReply({
        content: "❌ Only session owner can use this",
      });
    }
  }

  debug(SCOPE, "HANDLER_EXECUTE", sub);

  return handler(interaction);
}