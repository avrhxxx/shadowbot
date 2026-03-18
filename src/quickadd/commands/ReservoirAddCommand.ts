import { CommandInteraction } from "discord.js";
import { startQuickAddSession } from "./startQuickAddSession";

export async function rradd(interaction: CommandInteraction) {
  const dateArg = interaction.options.getString("date");

  if (!dateArg || !/^\d{4}$/.test(dateArg)) {
    await interaction.reply({
      content: "❌ Podaj datę MMDD (np. 0703).",
      ephemeral: true
    });
    return;
  }

  await startQuickAddSession({
    interaction,
    eventType: "RR",
    date: dateArg
  });
}