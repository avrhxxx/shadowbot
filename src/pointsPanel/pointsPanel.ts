// src/moderatorPanel/pointsPanel/pointsPanel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

/**
 * Renderuje Points Panel – główny wybór kategorii + guide/settings
 */
export function renderPointsPanel(): MessageCreateOptions {
  // Rząd 1: wybór kategorii
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_category_donations") // Alliance Donations
      .setLabel("Alliance Donations")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_category_duel") // Alliance Duel
      .setLabel("Alliance Duel")
      .setStyle(ButtonStyle.Primary)
  );

  // Rząd 2: guide i settings
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
    content: "📌 **Points Panel – Choose a category**",
    components: [row1, row2]
  };
}