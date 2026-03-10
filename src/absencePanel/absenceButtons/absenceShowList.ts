// src/absencePanel/absenceButtons/absenceShowList.ts
import { ButtonInteraction } from "discord.js";

export async function handleShowAbsences(interaction: ButtonInteraction) {
  await interaction.reply({
    content: "🛠 Show Absences not implemented yet.",
    ephemeral: true
  });
}