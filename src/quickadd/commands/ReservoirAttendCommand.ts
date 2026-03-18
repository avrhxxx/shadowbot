import { CommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function rrattend(interaction: CommandInteraction) {
  const dateArg = interaction.options.getString("date");
  if (!dateArg) {
    await interaction.reply({ content: "❌ Please provide a date in MMDD format.", ephemeral: true });
    return;
  }

  const guildId = interaction.guildId!;
  const moderatorId = interaction.user.id;

  const session = SessionManager.getInstance().createSession(guildId, moderatorId, "RR", dateArg);
  if (!session) {
    await interaction.reply({ content: "⚠️ A QuickAdd session is already active for this server.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: `✅ Reservoir Raid Attendance session started for ${dateArg}. Use #quickadd-session to submit attendance.`, ephemeral: true });
}
