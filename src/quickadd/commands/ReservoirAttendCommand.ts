import { CommandInteraction } from "discord.js";
import { startQuickAddSession } from "./startQuickAddSession";

export async function rrattend(interaction: CommandInteraction) {
  const dateArg = interaction.options.getString("date");

  if (!dateArg || !/^\d{4}$/.test(dateArg)) {
    await interaction.reply({
      content: "❌ Podaj datę MMDD.",
      ephemeral: true
    });
    return;
  }

  await startQuickAddSession({
    interaction,
    eventType: "RR_ATTEND",
    date: dateArg
  });
}