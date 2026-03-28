// src/pointsPanel/pointsPanel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, Interaction } from "discord.js";

/**
 * Renderuje główny panel punktów
 * Jeden rząd: Points Management | Weeks List | Guide | Settings
 */
export function renderPointsPanel(): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_management")
      .setLabel("Points Management")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("points_list_weeks")
      .setLabel("Weeks List")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("points_guide")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success), // zielony

    new ButtonBuilder()
      .setCustomId("points_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary) // szary
  );

  return {
    content: "📌 **Points Panel**",
    components: [row]
  };
}

/**
 * Handler dla głównego przycisku Points Menu
 */
export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel = renderPointsPanel();

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}