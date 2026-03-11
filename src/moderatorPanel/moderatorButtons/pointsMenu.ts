// src/moderatorPanel/moderatorButtons/pointsMenu.ts
import { Interaction } from "discord.js";
import { renderPointsPanel } from "../pointsPanel/pointsPanel";

export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel = renderPointsPanel();

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}