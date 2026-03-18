import { CommandInteraction } from "discord.js";
import { startQuickAddSession } from "./startQuickAddSession";

export async function dnadd(interaction: CommandInteraction) {
  const weekArg = interaction.options.getString("week");

  if (!weekArg || !/^\d{8}$/.test(weekArg)) {
    await interaction.reply({
      content: "❌ Format: MMDDMMDD (np. 01030703).",
      ephemeral: true
    });
    return;
  }

  await startQuickAddSession({
    interaction,
    eventType: "DN",
    week: weekArg
  });
}