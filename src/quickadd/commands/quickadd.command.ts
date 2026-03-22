// =====================================
// 📁 src/quickadd/commands/quickadd.command.ts
// =====================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";
import { ensureQuickAddChannel } from "../integrations/QuickAddChannelService";

export const quickAddCommand = new SlashCommandBuilder()
  .setName("quickadd")
  .setDescription("QuickAdd OCR system")
  .addSubcommand((sub) =>
    sub.setName("start").setDescription("Start session")
  )
  .addSubcommand((sub) =>
    sub.setName("end").setDescription("End session")
  );

export async function handleQuickAddCommand(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) return;

  // 🔥 CRITICAL FIX – zapobiega Unknown interaction
  await interaction.deferReply({ flags: 64 });

  const sub = interaction.options.getSubcommand();

  const channel = await ensureQuickAddChannel(interaction.guild);

  // 🔥 blokada – tylko w quick-add
  if (interaction.channelId !== channel.id) {
    return interaction.editReply({
      content: `❌ Use this command in <#${channel.id}>`,
    });
  }

  const session = QuickAddSession.get(interaction.guild.id);

  // =============================
  // ▶️ START
  // =============================
  if (sub === "start") {
    if (session) {
      return interaction.editReply({
        content: `❌ Session already active by <@${session.ownerId}>`,
      });
    }

    QuickAddSession.start(
      interaction.guild.id,
      channel.id,
      interaction.user.id
    );

    return interaction.editReply({
      content: "✅ Session started\n\n📸 Send screenshots now.",
    });
  }

  // =============================
  // ⛔ END
  // =============================
  if (sub === "end") {
    if (!session) {
      return interaction.editReply({
        content: "❌ No active session",
      });
    }

    if (session.ownerId !== interaction.user.id) {
      return interaction.editReply({
        content: "❌ Only session owner can end it",
      });
    }

    QuickAddSession.end(interaction.guild.id);

    return interaction.editReply({
      content: "🛑 Session ended",
    });
  }
}