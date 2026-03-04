// src/moderatorPanel/moderatorButtons/translateMenu.ts
import { Interaction } from "discord.js";

export async function handleTranslateMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  await interaction.reply({
    content: "Translate Menu – TODO",
    ephemeral: true
  });
}
