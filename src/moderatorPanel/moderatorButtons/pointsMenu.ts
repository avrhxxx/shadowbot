// src/moderatorPanel/moderatorButtons/pointsMenu.ts
import { Interaction } from "discord.js";
import { renderPointsCategoryPanel } from "../../pointsPanel/pointsPanel"; // <-- poprawiona ścieżka

export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel = renderPointsCategoryPanel(); // <-- używamy poprawnej nazwy funkcji

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}