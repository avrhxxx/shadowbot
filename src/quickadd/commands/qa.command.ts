// =====================================
// 📁 src/quickadd/commands/qa.command.ts
// =====================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../core/QuickAddSession";
import { ensureQuickAddChannel } from "../integrations/QuickAddChannelService";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";

export const qaCommand = new SlashCommandBuilder()
  .setName("qa")
  .setDescription("QuickAdd shortcut command")
  .addSubcommand((sub) =>
    sub.setName("start").setDescription("Start session")
  )
  .addSubcommand((sub) =>
    sub.setName("end").setDescription("End session")
  )
  .addSubcommand((sub) =>
    sub.setName("preview").setDescription("Preview parsed data")
  );

export async function handleQaCommand(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) return;

  await interaction.deferReply({ flags: 64 });

  const sub = interaction.options.getSubcommand();

  const channel = await ensureQuickAddChannel(interaction.guild);

  // 🔒 tylko quick-add channel
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
    QuickAddBuffer.clear(interaction.guild.id);

    return interaction.editReply({
      content: "🛑 Session ended",
    });
  }

  // =============================
  // 👀 PREVIEW
  // =============================
  if (sub === "preview") {
    if (!session) {
      return interaction.editReply({
        content: "❌ No active session",
      });
    }

    if (session.ownerId !== interaction.user.id) {
      return interaction.editReply({
        content: "❌ Only session owner can use preview",
      });
    }

    const data = QuickAddBuffer.getEntries(interaction.guild.id);

    if (!data.length) {
      return interaction.editReply({
        content: "⚠️ No parsed data yet",
      });
    }

    return interaction.editReply({
      content: `📊 Parsed preview:\n\n\`\`\`json\n${JSON.stringify(
        data,
        null,
        2
      )}\n\`\`\``,
    });
  }
}