// =====================================
// 📁 src/quickadd/commands/CommandHandler.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { CommandRegistry } from "./CommandRegistry";
import { ensureQuickAddChannel } from "../integrations/QuickAddChannelService";
import { QuickAddSession } from "../core/QuickAddSession";

export async function handleQuickAddInteraction(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) return;

  await interaction.deferReply({ flags: 64 });

  const sub = interaction.options.getSubcommand();

  const channel = await ensureQuickAddChannel(interaction.guild);

  if (interaction.channelId !== channel.id) {
    return interaction.editReply({
      content: `❌ Use this command in <#${channel.id}>`,
    });
  }

  const handler = CommandRegistry[sub];

  if (!handler) {
    return interaction.editReply({
      content: `❌ Unknown subcommand: ${sub}`,
    });
  }

  // 🔒 session check dla wszystkiego poza start
  if (sub !== "start") {
    const session = QuickAddSession.get(interaction.guild.id);

    if (!session) {
      return interaction.editReply({
        content: "❌ No active session",
      });
    }

    if (session.ownerId !== interaction.user.id) {
      return interaction.editReply({
        content: "❌ Only session owner can use this",
      });
    }
  }

  return handler(interaction);
}