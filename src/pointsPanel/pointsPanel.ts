// src/pointsPanel/pointsPanel.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageCreateOptions,
  Interaction
} from "discord.js";

/**
 * Renderuje główny panel Points
 * Row 1: kategorie punktów
 * Row 2: zarządzanie tygodniami
 * Row 3: guide + settings
 */
export function renderPointsCategoryPanel(): MessageCreateOptions {

  // Row 1 — Categories
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

  // Row 2 — Week management
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_create_week")
      .setLabel("Create Week")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("points_list_weeks")
      .setLabel("List Weeks")
      .setStyle(ButtonStyle.Secondary)
  );

  // Row 3 — Info / settings
  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_guide")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("points_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Points Panel – Choose Category**",
    components: [row1, row2, row3]
  };
}

/**
 * Handler przycisku Points Menu
 */
export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const panel = renderPointsCategoryPanel();

  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}