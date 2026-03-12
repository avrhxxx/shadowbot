// src/pointsPanel/pointsPanel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, Interaction } from "discord.js";

/**
 * Renderuje główny panel punktów
 * Rząd 1: Create Week / Weeks List / Categories
 * Rząd 2: Guide / Settings
 */
export function renderPointsPanel(): MessageCreateOptions {
  // Rząd 1: najważniejsze akcje
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_create_week")
      .setLabel("Create Week")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_list_weeks")
      .setLabel("Weeks List")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_category_select")
      .setLabel("Categories")
      .setStyle(ButtonStyle.Primary)
  );

  // Rząd 2: dodatkowe akcje
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
    content: "📌 **Points Panel – Main Menu**",
    components: [row1, row2]
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