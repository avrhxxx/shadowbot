// src/pointsPanel/pointsPanel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, Interaction } from "discord.js";

/**
 * Renderuje główny panel wyboru kategorii
 * Rząd 1: wybór kategorii
 * Rząd 2: Guide / Settings / Create Week / Weeks List
 */
export function renderPointsPanel(): MessageCreateOptions {
  // Rząd 1: wybór kategorii
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_category_donations")
      .setLabel("Alliance Donations")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_category_duel")
      .setLabel("Alliance Duel")
      .setStyle(ButtonStyle.Primary)
  );

  // Rząd 2: dodatkowe akcje
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_create_week")
      .setLabel("Create Week")
      .setStyle(ButtonStyle.Success), // zielony

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
    content: "📌 **Points Panel – Choose Category**",
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