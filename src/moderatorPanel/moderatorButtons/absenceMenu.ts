// src/moderatorPanel/moderatorButtons/absenceMenu.ts
import { Interaction } from "discord.js";

export async function handleAbsenceMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  await interaction.reply({
    content: "Not implemented yet",
    ephemeral: true
  });
}