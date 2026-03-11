// src/moderatorPanel/moderatorButtons/pointsMenu.ts
import { Interaction } from "discord.js";
import { renderPointsCategoryPanel } from "../../pointsPanel/pointsPanel"; // Poprawna ścieżka
import type { MessageCreateOptions } from "discord.js";

export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel: MessageCreateOptions = renderPointsCategoryPanel();

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}