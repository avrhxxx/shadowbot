import { CommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function dnadd(interaction: CommandInteraction) {
  const weekArg = interaction.options.getString("week");
  if (!weekArg) {
    await interaction.reply({ content: "❌ Please provide a week range in MMDDMMDD format.", ephemeral: true });
    return;
  }

  const guildId = interaction.guildId!;
  const moderatorId = interaction.user.id;

  const session = SessionManager.getInstance().createSession(guildId, moderatorId, "DN", weekArg);
  if (!session) {
    await interaction.reply({ content: "⚠️ A QuickAdd session is already active for this server.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: `✅ Donations QuickAdd session started for ${weekArg}. Use #quickadd-session to continue.`, ephemeral: true });
}