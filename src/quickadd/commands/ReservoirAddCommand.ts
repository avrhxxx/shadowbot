import { CommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function rradd(interaction: CommandInteraction) {
  const dateArg = interaction.options.getString("date");

  if (!dateArg) {
    await interaction.reply({
      content: "❌ Podaj datę w formacie MMDD (np. 0703).",
      ephemeral: true
    });
    return;
  }

  // ✅ walidacja formatu
  if (!/^\d{4}$/.test(dateArg)) {
    await interaction.reply({
      content: "❌ Format daty musi być MMDD (np. 0703).",
      ephemeral: true
    });
    return;
  }

  const guildId = interaction.guildId!;
  const moderatorId = interaction.user.id;
  const channelId = interaction.channelId;

  const sessionManager = SessionManager.getInstance();

  const session = sessionManager.createSession(
    guildId,
    moderatorId,
    {
      eventType: "RR",
      date: dateArg
    },
    channelId
  );

  if (!session) {
    await interaction.reply({
      content: "⚠️ Na tym serwerze jest już aktywna sesja QuickAdd.",
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `✅ Rozpoczęto sesję QuickAdd (RR) dla daty ${dateArg}.\nDodawaj wpisy w tym kanale.`,
    ephemeral: true
  });
}
