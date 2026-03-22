// src/quickadd/commands/quickadd.command.ts

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  startSession,
  endSession,
  getSession,
} from "../core/QuickAddSession";
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

  const sub = interaction.options.getSubcommand();

  const channel = await ensureQuickAddChannel(interaction.guild);

  // 🔥 blokada – tylko w quick-add
  if (interaction.channelId !== channel.id) {
    return interaction.reply({
      content: `❌ Use this command in <#${channel.id}>`,
      ephemeral: true,
    });
  }

  const session = getSession(interaction.guild.id);

  // =============================
  // ▶️ START
  // =============================
  if (sub === "start") {
    if (session?.active) {
      return interaction.reply({
        content: `❌ Session already active by <@${session.ownerId}>`,
        ephemeral: true,
      });
    }

    startSession(interaction.guild.id, interaction.user.id);

    return interaction.reply({
      content:
        "✅ Session started\n\n📸 Send screenshots now.",
      ephemeral: true,
    });
  }

  // =============================
  // ⛔ END
  // =============================
  if (sub === "end") {
    if (!session) {
      return interaction.reply({
        content: "❌ No active session",
        ephemeral: true,
      });
    }

    if (session.ownerId !== interaction.user.id) {
      return interaction.reply({
        content: "❌ Only session owner can end it",
        ephemeral: true,
      });
    }

    endSession(interaction.guild.id);

    return interaction.reply({
      content: "🛑 Session ended",
      ephemeral: true,
    });
  }
}