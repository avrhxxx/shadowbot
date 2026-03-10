// src/moderatorPanel/moderatorButtons/pointsMenu.ts
import { Interaction } from "discord.js";

export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  await interaction.reply({
    content: "Not implemented yet",
    ephemeral: true
  });
}
